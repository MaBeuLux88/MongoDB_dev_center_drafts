# Introduction to Data Pagination With Quarkus and MongoDB: A Comprehensive Tutorial

## Introduction

In modern web development, managing large datasets efficiently through APIs is crucial for enhancing application
performance and user experience. This tutorial explores pagination techniques using Quarkus and MongoDB, a robust
combination for scalable data delivery. Through a live coding session, we'll delve into different pagination methods and
demonstrate how to implement these in a Quarkus-connected MongoDB environment. This guide empowers developers to
optimize REST APIs for effective data handling.

You can find all the code presented in this tutorial in
the [GitHub repository](https://github.com/mongodb-developer/quarkus-pagination-sample):

```bash
git clone git@github.com:mongodb-developer/quarkus-pagination-sample.git
```

## Prerequisites

For this tutorial, you'll need:

- Java 21.
- Maven.
- A MongoDB cluster.
  - MongoDB Atlas (Option 1)
  - Docker (Option 2)

You can use the following Docker command to start a standalone MongoDB instance:

```bash
docker run --rm -d --name mongodb-instance -p 27017:27017 mongo
```

Or you can use MongoDB Atlas and try the M0 free tier to deploy your cluster.

## Create a Quarkus project

- Visit the [Quarkus Code Generator](https://code.quarkus.io/).
- Configure your project by selecting the desired options, such as the group and artifact ID.
- Add the necessary dependencies to your project. For this tutorial, we will add:
  - JNoSQL Document MongoDB [quarkus-jnosql-document-mongodb].
  - RESTEasy Reactive [quarkus-resteasy-reactive].
  - RESTEasy Reactive Jackson [quarkus-resteasy-reactive-jackson].
  - OpenAPI [quarkus-smallrye-openapi].

> Note: If you cannot find some dependencies, you can add them manually in the `pom.xml`. See the file below.

- Generate the project, download the ZIP file, and extract it to your preferred location. Remember that the file
  structure
  may vary with different Quarkus versions, but this should be fine for the tutorial. The core focus will be modifying
  the `pom.xml` file and source code, which remains relatively consistent across versions. Any minor structural
  differences should be good for your progress, and you can refer to version-specific documentation if needed for a
  seamless learning experience.

At this point, your pom.xml file should look like this:

```xml
<dependencies>
    <dependency>
        <groupId>io.quarkus</groupId>
        <artifactId>quarkus-smallrye-openapi</artifactId>
    </dependency>
    <dependency>
        <groupId>io.quarkiverse.jnosql</groupId>
        <artifactId>quarkus-jnosql-document-mongodb</artifactId>
        <version>3.3.0</version>
    </dependency>
    <dependency>
        <groupId>io.quarkus</groupId>
        <artifactId>quarkus-resteasy</artifactId>
    </dependency>
    <dependency>
        <groupId>io.quarkus</groupId>
        <artifactId>quarkus-resteasy-jackson</artifactId>
    </dependency>
    <dependency>
        <groupId>io.quarkus</groupId>
        <artifactId>quarkus-arc</artifactId>
    </dependency>
    <dependency>
        <groupId>io.quarkus</groupId>
        <artifactId>quarkus-junit5</artifactId>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>io.rest-assured</groupId>
        <artifactId>rest-assured</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```

We will work with the latest version of Quarkus alongside Eclipse JNoSQL Lite, a streamlined integration that notably
does not rely on reflection. This approach enhances performance and simplifies the configuration process, making it an
optimal choice for developers looking to maximize efficiency in their applications.

## Database configuration

Before you dive into the implementation, it's essential to configure your MongoDB database properly. In MongoDB, you
must often set up credentials and specific configurations to connect to your database instance. Eclipse JNoSQL provides
a flexible configuration mechanism that allows you to manage these settings efficiently.

You can find detailed configurations and setups for various databases, including MongoDB, in the [Eclipse JNoSQL GitHub
repository](https://github.com/eclipse/jnosql-databases?tab=readme-ov-file#configuration-10).

To run your application locally, you can configure the database name and properties in your application's
`application.properties` file. Open this file and add the following line to set the database name:

```properties
quarkus.mongodb.connection-string = mongodb://localhost
jnosql.document.database = fruits
```

This configuration will enable your application to:
- Use the "fruits" database.
- Connect to the MongoDB cluster available at the provided connection string.

In production, make sure to enable access control and enforce authentication. See the [security checklist](https://www.mongodb.com/docs/manual/administration/security-checklist/) for more
details.

It's worth mentioning that Eclipse JNoSQL leverages Eclipse MicroProfile Configuration, which is designed to facilitate
the implementation of [twelve-factor applications](https://12factor.net/), especially in configuration management. It means you can override
properties through environment variables, allowing you to switch between different configurations for development,
testing, and production without modifying your code. This flexibility is a valuable aspect of building robust and easily
deployable applications.

Now that your database is configured, you can proceed with the tutorial and create your RESTful API with Quarkus and
Eclipse JNoSQL for MongoDB.

## Create a fruit entity

In this step, we will create a simple `Fruit` entity using Java records. Create a new class in the `src/main/java`
directory named `Fruit`.

```java
import jakarta.nosql.Column;
import jakarta.nosql.Convert;
import jakarta.nosql.Entity;
import jakarta.nosql.Id;
import org.eclipse.jnosql.databases.mongodb.mapping.ObjectIdConverter;

@Entity
public class Fruit {

    @Id
    @Convert(ObjectIdConverter.class)
    private String id;

    @Column
    private String name;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    @Override
    public String toString() {
        return "Fruit{" +
                "id='" + id + '\'' +
                ", name='" + name + '\'' +
                '}';
    }


    public static Fruit of(String name) {
        Fruit fruit = new Fruit();
        fruit.setName(name);
        return fruit;
    }

}
```

## Create a fruit repository

We will simplify the integration between Java and MongoDB using the Jakarta Data repository by creating an interface
that extends NoSQLRepository. The framework automatically implements this interface, enabling us to define methods for
data retrieval that integrate seamlessly with MongoDB. We will focus on implementing two types of pagination: offset
pagination represented by `Page` and keyset (cursor) pagination represented by `CursoredPage`.

Here's how we define the FruitRepository interface to include methods for both pagination strategies:

```java
import jakarta.data.Sort;
import jakarta.data.page.CursoredPage;
import jakarta.data.page.Page;
import jakarta.data.page.PageRequest;
import jakarta.data.repository.BasicRepository;
import jakarta.data.repository.Find;
import jakarta.data.repository.OrderBy;
import jakarta.data.repository.Repository;

@Repository
public interface FruitRepository extends BasicRepository<Fruit, String> {

    @Find
    CursoredPage<Fruit> cursor(PageRequest pageRequest, Sort<Fruit> order);

    @Find
    @OrderBy("name")
    Page<Fruit> offSet(PageRequest pageRequest);

    long countBy();

}
```

## Create setup

We'll demonstrate how to populate and manage the MongoDB database with a collection of fruit entries at the start of the
application using Quarkus. We'll ensure our database is initialized with predefined data, and we'll also handle cleanup
on application shutdown. Here's how we can structure the SetupDatabase class:

```java
import jakarta.enterprise.context.ApplicationScoped;

import jakarta.enterprise.event.Observes;

import io.quarkus.runtime.ShutdownEvent;
import io.quarkus.runtime.StartupEvent;
import org.jboss.logging.Logger;

import java.util.List;

@ApplicationScoped
public class SetupDatabase {

    private static final Logger LOGGER = Logger.getLogger(SetupDatabase.class.getName());

    private final FruitRepository fruitRepository;

    public SetupDatabase(FruitRepository fruitRepository) {
        this.fruitRepository = fruitRepository;
    }


    void onStart(@Observes StartupEvent ev) {
        LOGGER.info("The application is starting...");
        long count = fruitRepository.countBy();
        if (count > 0) {
            LOGGER.info("Database already populated");
            return;
        }
        List<Fruit> fruits = List.of(
                Fruit.of("apple"),
                Fruit.of("banana"),
                Fruit.of("cherry"),
                Fruit.of("date"),
                Fruit.of("elderberry"),
                Fruit.of("fig"),
                Fruit.of("grape"),
                Fruit.of("honeydew"),
                Fruit.of("kiwi"),
                Fruit.of("lemon")
        );
        fruitRepository.saveAll(fruits);
    }

    void onStop(@Observes ShutdownEvent ev) {
        LOGGER.info("The application is stopping...");
        fruitRepository.deleteAll(fruitRepository.findAll().toList());
    }

}
```

## Create a REST API

Now, let's create a RESTful API to manage developer records. Create a new class in `src/main/java`
named `FruitResource`.

```java
import jakarta.data.Sort;
import jakarta.data.page.PageRequest;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;

@Path("/fruits")
public class FruitResource {

    private final FruitRepository fruitRepository;

    private static final Sort<Fruit> ASC = Sort.asc("name");
    private static final Sort<Fruit> DESC = Sort.asc("name");

    public FruitResource(FruitRepository fruitRepository) {
        this.fruitRepository = fruitRepository;
    }

    @Path("/offset")
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Iterable<Fruit> hello(@QueryParam("page") @DefaultValue("1") long page,
                                 @QueryParam("size") @DefaultValue("2") int size) {
        var pageRequest = PageRequest.ofPage(page).size(size);
        return fruitRepository.offSet(pageRequest).content();
    }

    @Path("/cursor")
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Iterable<Fruit> cursor(@QueryParam("after") @DefaultValue("") String after,
                                  @QueryParam("before") @DefaultValue("") String before,
                                  @QueryParam("size") @DefaultValue("2") int size) {
        if (!after.isBlank()) {
            var pageRequest = PageRequest.ofSize(size).afterCursor(PageRequest.Cursor.forKey(after));
            return fruitRepository.cursor(pageRequest, ASC).content();
        } else if (!before.isBlank()) {
            var pageRequest = PageRequest.ofSize(size).beforeCursor(PageRequest.Cursor.forKey(before));
            return fruitRepository.cursor(pageRequest, DESC).stream().toList();
        }
        var pageRequest = PageRequest.ofSize(size);
        return fruitRepository.cursor(pageRequest, ASC).content();
    }

}
```

## Test the REST API

Now that we've created our RESTful API for managing developer records, it's time to put it to the test. We'll
demonstrate how to interact with the API using various HTTP requests and command-line tools.

### Start the project

```bash
./mvnw compile quarkus:dev
```

### Exploring pagination with offset

We will use `curl` to learn more about pagination using the URLs provided. It is a command-line tool that is often used
to send HTTP requests. The URLs you have been given are used to access a REST API endpoint fetching fruit pages using
offset pagination. Each URL requests a different page, enabling us to observe how pagination functions via the API.
Below is how you can interact with these endpoints using the `curl` tool.

#### Fetching the first page

This command requests the first page of fruits from the server.

```bash
curl --location http://localhost:8080/fruits/offset?page=1
```

#### Fetching the second page

This command gets the next set of fruits, which is the second page.

```bash
curl --location http://localhost:8080/fruits/offset?page=2
```

#### Fetching the fifth page

By requesting the fifth page, you can see how the API responds when you request a page that might be beyond the range of
existing data.

```bash
curl --location http://localhost:8080/fruits/offset?page=5
```

### Exploring pagination with a cursor

To continue exploring cursor-based pagination with your API, using both `after` and `before` parameters provides a way
to navigate through your dataset forward and backward respectively. This method allows for flexible data retrieval,
which can be particularly useful for interfaces that allow users to move to the next or previous set of results. Here's
how you can structure your `curl` commands to use these parameters effectively:

#### Fetching the initial set of fruits

This command gets the first batch of fruits without specifying a cursor, starting from the beginning.

```bash
curl --location http://localhost:8080/fruits/cursor
```

#### Fetching fruits after "banana"

This command fetches the list of fruits that appear after "banana" in your dataset. This is useful for moving forward in
the list.

```bash
curl --location http://localhost:8080/fruits/cursor?after=banana
```

#### Fetching fruits before "date"

This command is used to go back to the set of fruits that precede "date" in the dataset. This is particularly useful for
implementing "Previous" page functionality.

```bash
curl --location http://localhost:8080/fruits/cursor?before=date
```

## Conclusion

This tutorial explored the fundamentals and implementation of pagination using Quarkus and MongoDB, demonstrating how to
manage large datasets in web applications effectively. By integrating the Jakarta Data repository with Quarkus, we
designed interfaces that streamline the interaction between Java and MongoDB, supporting offset and cursor-based
pagination techniques. We started by setting up a basic Quarkus application and configuring MongoDB connections. Then,
we demonstrated how to populate the database with initial data and ensure clean shutdown behavior.

Throughout this tutorial, we've engaged in live coding sessions, implementing and testing various pagination methods.
We've used the `curl` command to interact with the API, fetching data with no parameters, and using `after` and `before`
parameters to navigate through the dataset forward and backward. The use of cursor-based pagination, in particular,
has showcased its benefits in scenarios where datasets are frequently updated or when precise data retrieval control is
needed. This approach not only boosts performance by avoiding the common issues of offset pagination but also provides a
user-friendly way to navigate through data.

Ready to explore the benefits of MongoDB Atlas? Get started now by [trying MongoDB Atlas](https://www.mongodb.com/atlas/database).

Access the [source code](https://github.com/mongodb-developer/quarkus-pagination-sample) used in this tutorial.

Any questions? Come chat with us in the [MongoDB Community Forum](https://www.mongodb.com/community/forums/).
