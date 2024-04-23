# How to Enable Local and Automatic Testing of Atlas Search-Based Features

## Introduction

Atlas Search enables you to perform full-text queries on your MongoDB database. In this post, I want to show how you can
use test containers to write integration tests for Atlas Search-based queries, so that you can run them locally and in
your CI/CD pipeline without the need to connect to an actual MongoDB Atlas instance.

TL;DR: All the source code explained in this post is available on [GitHub](https://github.com/mongodb-developer/atlas-search-local-testing):

```bash
git clone git@github.com:mongodb-developer/atlas-search-local-testing.git
```

MongoDB Atlas Search is a powerful combination of a document-oriented database and full-text search capabilities. This
is not only valuable for use cases where you want to perform full-text queries on your data. With Atlas Search, it is
possible to easily enable use cases that would be hard to implement in standard MongoDB due to certain limitations.

Some of these limitations hit us in a recent project in which we developed a webshop. The rather obvious requirement
for this shop included that customers should be able to filter products and that the filters should show how many items
are available in each category. Over the course of the project, we kept increasing the number of filters in the
application. This led to two problems:

- We wanted customers to be able to arbitrarily choose filters. Since every filter needs an index to run efficiently,
  and since indexes can‘t be combined (intersected), this leads to a proliferation of indexes that are hard to
  maintain (in addition MongoDB allows only 64 indexes, adding another complexity level).

- With an increasing number of filters, the calculation of the facets for indicating the number of available items in
  each category also gets more complex and more expensive.

As the developer effort to handle this complexity with standard MongoDB tools grew larger over time, we decided to give
Atlas Search a try. We knew that Atlas Search is an embedded full-text search in MongoDB Atlas based on Apache Lucene
and that Lucene is a mighty tool for text search, but we were actually surprised at how well it supports our filtering use
case.

With Atlas Search, you can create one or more so-called search indexes that contain your documents as a whole or just
parts of them. Therefore, you can use just one index for all of your queries without the need to maintain additional
indexes, e.g., for the most used filter combinations. Plus, you can also use the search index to calculate the facets
needed to show item availability without writing complex queries that are not 100% backed up by an index.

The downside of this approach is that Atlas Search makes it harder to write unit or integration tests. When you're using
standard MongoDB, you'll easily find some plug-ins for your testing framework that provide an in-memory MongoDB to run
your tests against, or you use some kind of test container to set the stage for your tests. Although Atlas Search
queries seamlessly integrate into MongoDB aggregation pipelines on Atlas, standard MongoDB cannot process this type of
aggregation stage.

To solve this problem, the recently released Atlas CLI allows you to start a local instance of a MongoDB cluster that
can actually handle Atlas Search queries. Internally, it starts two containers, and after deploying your search index via
CLI, you can run your tests locally against these containers. While this allows you to run your tests locally, it can be
cumbersome to set up this local cluster and start/stop it every time you want to run your tests. This has to be done
by each developer on their local machine, adds complexity to the onboarding of new people working on the software, and
is rather hard to integrate into a CI/CD pipeline.

Therefore, we asked ourselves if there is a way to provide a solution
that does not need a manual setup for these containers and enables automatic start and shutdown. Turns out there
is a way to do just that, and the solution we found is, in fact, a rather lean and reusable one that can also help with
automated testing in your project.

## Preparing test containers

The key idea of test containers is to provide a disposable environment for testing. As the name suggests, it is based on
containers, so in the first step, we need a Docker image or a [Docker Compose](https://docs.docker.com/compose/) script
to start with.

Atlas CLI uses two Docker images to create an environment that enables testing Atlas Search queries locally:
mongodb/mongodb-enterprise-server is responsible for providing database capabilities and mongodb/mongodb-atlas-search is
providing full-text search capabilities. Both containers are part of a MongoDB cluster, so they need to communicate with
each other.

Based on this information, we can create a docker–compose.yml, where we define two containers, create a network, and set
some parameters in order to enable the containers to talk to each other. The example below shows the complete
docker–compose.yml needed for this article. The naming of the containers is based on the naming convention of the
Atlas Search architecture: The `mongod` container provides the database capabilities while the `mongot` container
provides
the full-text search capabilities. As both containers need to know each other, we use environment variables to let each
of them know where to find the other one. Additionally, they need a shared secret in order to connect to each other, so
this is also defined using another environment variable.

```bash
version: "2"

services:
    mongod:
        container_name: mongod
        image: mongodb/mongodb-enterprise-server:7.0-ubi8
        entrypoint: "/bin/sh -c \"echo \"$$KEYFILECONTENTS\" > \"$$KEYFILE\"\n\nchmod 400 \"$$KEYFILE\"\n\n\npython3 /usr/local/bin/docker-entrypoint.py mongod --transitionToAuth --keyFile \"$$KEYFILE\" --replSet \"$$REPLSETNAME\" --setParameter \"mongotHost=$$MONGOTHOST\" --setParameter \"searchIndexManagementHostAndPort=$$MONGOTHOST\"\""
        environment:
            MONGOTHOST: 10.6.0.6:27027
            KEYFILE: /data/db/keyfile
            KEYFILECONTENTS: sup3rs3cr3tk3y
            REPLSETNAME: local
        ports:
            - 27017:27017
        networks:
            network:
                ipv4_address: 10.6.0.5
    mongot:
        container_name: mongot
        image: mongodb/mongodb-atlas-search:preview
        entrypoint: "/bin/sh -c \"echo \"$$KEYFILECONTENTS\" > \"$$KEYFILE\"\n\n/etc/mongot-localdev/mongot  --mongodHostAndPort \"$$MONGOD_HOST_AND_PORT\" --keyFile \"$$KEYFILE\"\""
        environment:
            MONGOD_HOST_AND_PORT: 10.6.0.5:27017
            KEYFILE: /var/lib/mongot/keyfile
            KEYFILECONTENTS: sup3rs3cr3tk3y
        ports:
            - 27027:27027
        networks:
            network:
                ipv4_address: 10.6.0.6
networks:
  network:
    driver: bridge
    ipam:
      config:
        - subnet: 10.6.0.0/16
          gateway: 10.6.0.1
```

Before we can use our environment in tests, we still need to create our search index. On top of that, we need to
initialize the replica set which is needed as the two containers form a cluster. There are multiple ways to achieve
this:

- One way is to use the Testcontainers framework to start the Docker Compose file and a test framework
  like [jest](https://jestjs.io/) which allows you to define setup and teardown methods for your tests. In the setup
  method, you can initialize the replica set and create the search index. An advantage of this approach is that you
  don't
  need to start your Docker Compose manually before you run your tests.
- Another way is to extend the Docker Compose file by a third container which simply runs a script to accomplish the
  initialization of the replica set and the creation of the search index.

As the first solution offers a better developer experience by allowing tests to be run using just one command, without
the need to start the Docker environment manually, we will focus on that one. Additionally, this enables us to easily
run our tests in our CI/CD pipeline.

The following code snippet shows an implementation of a jest setup function. At first, it starts the Docker Compose
environment we defined before. After the containers have been started, the script builds a connection string to
be able to connect to the cluster using a MongoClient (mind the `directConnection=true` parameter!). The MongoClient
connects to the cluster and issues an admin command to initialize the replica set. Since this command takes
some milliseconds to complete, the script waits for some time before creating the search index. After that, we load an
Atlas Search index definition from the file system and use `createSearchIndex` to create the index on the cluster. The
content of the index definition file can be created by simply exporting the definition from the Atlas web UI. The only
information not included in this export is the index name. Therefore, we need to set it explicitly (important: the name
needs to match the index name in your production code!). After that, we close the database connection used by MongoClient
and save a reference to the Docker environment to tear it down after the tests have run.

```javascript
export default async () => {
    const environment = await new DockerComposeEnvironment(".", "docker-compose.yml").up()
    const port = environment.getContainer("mongod").getFirstMappedPort()
    const host = environment.getContainer("mongod").getHost()
    process.env.MONGO_URL = `mongodb://${host}:${port}/atlas-local-test?directConnection=true`
    const mongoClient = new MongoClient(process.env.MONGO_URL)
    try {
        await mongoClient
            .db()
            .admin()
            .command({
                replSetInitiate: {
                    _id: "local",
                    members: [{_id: 0, host: "10.6.0.5:27017"}]
                }
            })
        await new Promise((r) => setTimeout(r, 500))
        const indexDefinition = path.join(__dirname, "../index.json")
        const definition = JSON.parse(fs.readFileSync(indexDefinition).toString("utf-8"))
        const collection = await mongoClient.db("atlas-local-test").createCollection("items")
        await collection.createSearchIndex({name: "items-index", definition})
    } finally {
        await mongoClient.close()
    }
    global.__MONGO_ENV__ = environment
}
```

## Writing and running tests

When you write integration tests for your queries, you need to insert data into your database before running the tests.
Usually, you would insert the needed data at the beginning of your test, run your queries, check the results, and have
some clean-up logic that runs after each test. Because the Atlas Search index is located on another
container (`mongot`) than the actual data (`mongod`), it takes some time until the Atlas Search node has processed the
events from the so-called change stream and $search queries return the expected data. This fact has an impact on the
duration of the tests, as the following three scenarios show:

- We insert our test data in each test as before. As inserting or updating documents does not immediately lead to the
  search index being updated (the `mongot` has to listen to events of the change stream and process them), we would need
  to
  wait some time after writing data before we can be sure that the query returns the expected data. That is, we would
  need
  to include some kind of sleep() call in every test.
- We create test data for each test suite. Inserting test data once per test suite using a beforeAll() method brings
  down
  the time we have to wait for the `mongot` container to process the updates. The disadvantage of this approach is
  that
  we have to prepare the test data in such a way that it is suitable for all tests of this test suite.
- We create global test data for all test suites. Using the global setup method from the last section, we could also
  insert data into the database before creating the index. When the initial index creation has been completed, we will
  be
  ready to run our tests without waiting for some events from the change stream to be processed. But also in this
  scenario, your test data management gets more complex as you have to create test data that fits all your test
  scenarios.

In our project, we went with the second scenario. We think that it provides a good compromise between runtime requirements
and the complexity of test data management. Plus, we think of these tests as integration tests where we do not need to test
every corner case. We just need to make sure that the query can be executed and returns the expected data.

The exemplary test suite shown below follows the first approach. In beforeAll, some documents are inserted into the
database. After that, the method is forced to “sleep” some time before the actual tests are run.

```javascript
beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URL!)
    const itemModel1 = new MongoItem({
        name: "Cool Thing",
        price: 1337,
    })
    await MongoItemModel.create(itemModel1)
    const itemModel2 = new MongoItem({
        name: "Nice Thing",
        price: 10000,
    })
    await MongoItemModel.create(itemModel2)
    await new Promise((r) => setTimeout(r, 1000))
})

describe("MongoItemRepository", () => {
    describe("getItemsInPriceRange", () => {
        it("get all items in given price range", async () => {
            const items = await repository.getItemsInPriceRange(1000, 2000)
            expect(items).toHaveLength(1)
        })
    })
})

afterAll(async () => {
    await mongoose.connection.collection("items").deleteMany({})
    await mongoose.connection.close()
})
```

## Conclusion

Before having a more in-depth look at it, we put Atlas Search aside for all the wrong reasons: We had no need for
full-text searches and thought it was not really possible to run tests on it. After using it for a while, we can
genuinely say that Atlas Search is not only a great tool for applications that use full-text search-based features. It
can also be used to realize more traditional query patterns and reduce the load on the database. As for the testing
part, there have been some great improvements since the feature was initially rolled out and by now, we have reached a
state where testability is not an unsolvable issue anymore, even though it still requires some setup.

With the container
images provided by MongoDB and some of the Docker magic introduced in this article, it is now possible to run
integration tests for these queries locally and also in your CI/CD pipeline. Give it a try if you haven't yet and let us
know how it works for you.

You can find the complete source code for the example described in this post in the
[GitHub repository](https://github.com/mongodb-developer/atlas-search-local-testing). There's still some room for
improvement that can be incorporated into the test setup. Future updates of the tools might enable us to write tests
without the need to wait some time before we can continue running our tests so that one day, we can all write some
MongoDB Atlas Search integration tests without any hassle.

Questions? Comments? Head to the [MongoDB Developer Community](https://www.mongodb.com/community/forums/) to continue the conversation!
