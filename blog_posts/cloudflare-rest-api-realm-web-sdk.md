## Introduction

[Cloudflare Workers](https://workers.cloudflare.com/) provides a serverless execution environment that allows you to create entirely new applications or augment existing ones without configuring or maintaining infrastructure.

[MongoDB Atlas](https://www.mongodb.com/cloud/atlas) allows you to create, manage, and monitor MongoDB clusters in the cloud provider of your choice (AWS, GCP, or Azure) while the [Web SDK](https://www.mongodb.com/docs/realm/web/) can provide a layer of authentication and define access rules to the collections.

In this blog post, we will combine all these technologies together and create a REST API with a Cloudflare worker using a MongoDB Atlas cluster to store the data.

> Note: In this tutorial, the worker isn't using any form of caching. While the connection between MongoDB and the Atlas serverless application is established and handled automatically in the Atlas App Services back end, each new query sent to the worker will require the user to go through the authentication and authorization process before executing any query. In this tutorial, we are using API keys to handle this process but Atlas App Services offers many different [authentication providers](https://www.mongodb.com/docs/atlas/app-services/users/#authentication-providers).

## TL;DR!

The worker is in this [GitHub repository](https://github.com/mongodb-developer/cloudflare-worker-rest-api-atlas). The [README](https://github.com/mongodb-developer/cloudflare-worker-rest-api-atlas/blob/main/README.md) will get you up and running in no time, if you know what you are doing. Otherwise, I suggest you follow this step-by-step blog post. ;-)

```shell
$ git clone git@github.com:mongodb-developer/cloudflare-worker-rest-api-atlas.git
```

## Prerequisites

- NO credit card! You can run this entire tutorial for free!
- [Git](https://git-scm.com/) and [cURL](https://en.wikipedia.org/wiki/CURL).
- [MongoDB Atlas account](https://www.mongodb.com/cloud/atlas/).
- [MongoDB Atlas Cluster (a free M0 cluster is fine)](https://docs.atlas.mongodb.com/tutorial/deploy-free-tier-cluster/).
- [Cloudflare](https://www.cloudflare.com/) account (free plan is fine) with a `*.workers.dev` subdomain for the workers. Follow [steps 1 to 3 from this documentation](https://developers.cloudflare.com/workers/get-started/guide) to get everything you need.

We will create the Atlas App Services application (formerly known as a MongoDB Realm application) together in the next section. This will provide you the AppID and API key that we need.

To deploy our Cloudflare worker, we will need:
- The [application ID](https://www.mongodb.com/docs/atlas/app-services/manage-apps/create/create-with-ui/) (top left corner in your app—see next section).
- The Cloudflare account login/password.
- The Cloudflare account ID (in Workers tab > Overview).

To test (or interact with) the REST API, we need:
- The authentication API key (more about that below, but it's in Authentication tab > API Keys).
- The Cloudflare `*.workers.dev` subdomain (in Workers tab > Overview).

It was created during this step of your set-up:

![Cloudflare subdomain creation](https://mongodb-devhub-cms.s3.us-west-1.amazonaws.com/create_subdomain_445263d59f.png)

## Create and Configure the Atlas Application

To begin with, head to your MongoDB Atlas main page where you can see your cluster and access the 'App Services' tab at the top.

![MongoDB Atlas App Services](https://mongodb-devhub-cms.s3.us-west-1.amazonaws.com/App_Services_UI_7c1682e8a4.png)

[Create an empty application](https://www.mongodb.com/docs/atlas/app-services/manage-apps/create/create-with-ui/) (no template) as close as possible to your MongoDB Atlas cluster to avoid latency between your cluster and app. My app is "local" in Ireland (eu-west-1) in my case.

Now that our app is created, we need to set up two things: authentication via API keys and collection rules. Before that, note that you can retrieve your app ID in the top left corner of your new application.

![Atlas App Service AppID](https://mongodb-devhub-cms.s3.us-west-1.amazonaws.com/Cloudflare_App_ID_4bbe1c06b2.png)

### Authentication Via API Keys

Head to Authentication > API Keys.

![Authentication by API keys](https://mongodb-devhub-cms.s3.us-west-1.amazonaws.com/Cloudflare_Auth_4c4dbb77dd.png)

Activate the provider and save the draft.

![Activate authentication by API keys](https://mongodb-devhub-cms.s3.us-west-1.amazonaws.com/Enable_Auth_40a8469d77.png)

We need to create an API key, but we can only do so if the provider is already deployed. Click on review and deploy.

![Review draft and deploy button](https://mongodb-devhub-cms.s3.us-west-1.amazonaws.com/Review_Draft_00f943f822.png)

Now you can create an API key and **save it somewhere**! It will only be displayed **once**. If you lose it, discard this one and create a new one.

![API key](https://mongodb-devhub-cms.s3.us-west-1.amazonaws.com/API_Key_4005d64dc9.png)

We only have a single user in our application as we only created a single API key. Note that this tutorial would work with any [other authentication method](https://www.mongodb.com/docs/atlas/app-services/users/#authentication-providers) if you update the authentication code accordingly in the worker.

### Collection Rules

By default, your application cannot access any collection from your MongoDB Atlas cluster. To define how users can interact with the data, you must [define roles and permissions](https://docs.mongodb.com/realm/mongodb/define-roles-and-permissions/).

In our case, we want to create a basic REST API where each user can read and write their own data in a single collection `todos` in the `cloudflare` database.

Head to the Rules tab and let's create this new `cloudflare.todos` collection.

First, click "create a collection".

![Access rules and click to create a new collection](https://mongodb-devhub-cms.s3.us-west-1.amazonaws.com/Create_Collection_b35881aff7.png)

Next, name your database  `cloudflare` and collection  `todos`. Click create!

![Create a new collection to add a rule](https://mongodb-devhub-cms.s3.us-west-1.amazonaws.com/Name_Collection_9435b5eb39.png)

Each document in this collection will belong to a unique user defined by the `owner_id` field. This field will contain the user ID that you can see in the `App Users` tab.

To limit users to only reading and writing their own data, click on your new `todos` collection in the Rules UI. Add the rule `readOwnWriteOwn` in the `Other presets`.

![Rule Read Own Write Own](https://images.contentstack.io/v3/assets/blt39790b633ee0d5a7/blte1bdebe491481003/66074198e838c8a21b60caf3/readOwnWriteOwn.png)

After adding this preset role, you can double-check the rule by clicking on the `Advanced view`. It should contain the following:

```json
{
  "roles": [
    {
      "name": "readOwnWriteOwn",
      "apply_when": {},
      "document_filters": {
        "write": {
          "owner_id": "%%user.id"
        },
        "read": {
          "owner_id": "%%user.id"
        }
      },
      "read": true,
      "write": true,
      "insert": true,
      "delete": true,
      "search": true
    }
  ]
}
```

You can now click one more time on `Review Draft and Deploy`. Our application is now ready to use.

## Set Up and Deploy the Cloudflare Worker

The Cloudflare worker is available in [GitHub repository](https://github.com/mongodb-developer/cloudflare-worker-rest-api-realm-atlas). Let's clone the repository.

```shell
$ git clone git@github.com:mongodb-developer/cloudflare-worker-rest-api-atlas.git
$ cd cloudflare-worker-rest-api-realm-atlas
$ npm install
```

Now that we have the worker template, we just need to change the configuration to deploy it on your Cloudflare account.

Edit the file `wrangler.toml`:
- Replace `CLOUDFLARE_ACCOUNT_ID` with your real Cloudflare account ID.
- Replace `MONGODB_ATLAS_APPID` with your real MongoDB Atlas App Services app ID.

You can now deploy your worker to your Cloudflare account using [Wrangler](https://developers.cloudflare.com/workers/cli-wrangler/install-update):

```shell
$ npm i wrangler -g
$ wrangler login
$ wrangler deploy
```

Head to your Cloudflare account. You should now see your new worker in the Workers tab > Overview.

![New worker created in your cloudflare account](https://mongodb-devhub-cms.s3.us-west-1.amazonaws.com/cloudflare_worker_deployed_e2f606f4c5_37e33747b4.png)

## Check Out the REST API Code

Before we test the API, please take a moment to read the [code of the REST API](https://github.com/mongodb-developer/cloudflare-worker-rest-api-realm-atlas/blob/main/src/index.ts) we just deployed, which is in the `src/index.ts` file:

```typescript
import * as Realm from 'realm-web';
import * as utils from './utils';

// The Worker's environment bindings. See `wrangler.toml` file.
interface Bindings {
    // MongoDB Atlas Application ID
    ATLAS_APPID: string;
}

// Define type alias; available via `realm-web`
type Document = globalThis.Realm.Services.MongoDB.Document;

// Declare the interface for a "todos" document
interface Todo extends Document {
    owner_id: string;
    done: boolean;
    todo: string;
}

let App: Realm.App;
const ObjectId = Realm.BSON.ObjectID;

// Define the Worker logic
const worker: ExportedHandler<Bindings> = {
    async fetch(req, env) {
        const url = new URL(req.url);
        App = App || new Realm.App(env.ATLAS_APPID);

        const method = req.method;
        const path = url.pathname.replace(/[/]$/, '');
        const todoID = url.searchParams.get('id') || '';

        if (path !== '/api/todos') {
            return utils.toError(`Unknown '${path}' URL; try '/api/todos' instead.`, 404);
        }

        const token = req.headers.get('authorization');
        if (!token) return utils.toError(`Missing 'authorization' header; try to add the header 'authorization: ATLAS_APP_API_KEY'.`, 401);

        try {
            const credentials = Realm.Credentials.apiKey(token);
            // Attempt to authenticate
            var user = await App.logIn(credentials);
            var client = user.mongoClient('mongodb-atlas');
        } catch (err) {
            return utils.toError('Error with authentication.', 500);
        }

        // Grab a reference to the "cloudflare.todos" collection
        const collection = client.db('cloudflare').collection<Todo>('todos');

        try {
            if (method === 'GET') {
                if (todoID) {
                    // GET /api/todos?id=XXX
                    return utils.reply(
                        await collection.findOne({
                            _id: new ObjectId(todoID)
                        })
                    );
                }

                // GET /api/todos
                return utils.reply(
                    await collection.find()
                );
            }

            // POST /api/todos
            if (method === 'POST') {
                const {todo} = await req.json();
                return utils.reply(
                    await collection.insertOne({
                        owner_id: user.id,
                        done: false,
                        todo: todo,
                    })
                );
            }

            // PATCH /api/todos?id=XXX&done=true
            if (method === 'PATCH') {
                return utils.reply(
                    await collection.updateOne({
                        _id: new ObjectId(todoID)
                    }, {
                        $set: {
                            done: url.searchParams.get('done') === 'true'
                        }
                    })
                );
            }

            // DELETE /api/todos?id=XXX
            if (method === 'DELETE') {
                return utils.reply(
                    await collection.deleteOne({
                        _id: new ObjectId(todoID)
                    })
                );
            }

            // unknown method
            return utils.toError('Method not allowed.', 405);
        } catch (err) {
            const msg = (err as Error).message || 'Error with query.';
            return utils.toError(msg, 500);
        }
    }
}

// Export for discoverability
export default worker;
```

## Test the REST API

Now that you are a bit more familiar with this REST API, let's test it!

Note that we decided to pass the values as parameters and the authorization API key as a header like this:

```
authorization: API_KEY_GOES_HERE
```

You can use [Postman](https://www.postman.com/) or anything you want to test your REST API, but to make it easy, I made some bash script in the `api_tests` folder.

In order to make them work, we need to edit the file `api_tests/variables.sh` and provide them with:

- The Cloudflare worker URL: Replace `YOUR_SUBDOMAIN`, so the final worker URL matches yours.
- The MongoDB Atlas App Service API key: Replace `YOUR_ATLAS_APP_AUTH_API_KEY` with your auth API key.

Finally, we can execute all the scripts like this, for example:

```shell
$ cd api_tests

$ ./post.sh "Write a good README.md for Github"
{
  "insertedId": "618615d879c8ad6d1129977d"
}

$ ./post.sh "Commit and push"
{
  "insertedId": "618615e479c8ad6d11299e12"
}

$ ./findAll.sh 
[
  {
    "_id": "618615d879c8ad6d1129977d",
    "owner_id": "6186154c79c8ad6d11294f60",
    "done": false,
    "todo": "Write a good README.md for Github"
  },
  {
    "_id": "618615e479c8ad6d11299e12",
    "owner_id": "6186154c79c8ad6d11294f60",
    "done": false,
    "todo": "Commit and push"
  }
]

$ ./findOne.sh 618615d879c8ad6d1129977d
{
  "_id": "618615d879c8ad6d1129977d",
  "owner_id": "6186154c79c8ad6d11294f60",
  "done": false,
  "todo": "Write a good README.md for Github"
}

$ ./patch.sh 618615d879c8ad6d1129977d true
{
  "matchedCount": 1,
  "modifiedCount": 1
}

$ ./findAll.sh 
[
  {
    "_id": "618615d879c8ad6d1129977d",
    "owner_id": "6186154c79c8ad6d11294f60",
    "done": true,
    "todo": "Write a good README.md for Github"
  },
  {
    "_id": "618615e479c8ad6d11299e12",
    "owner_id": "6186154c79c8ad6d11294f60",
    "done": false,
    "todo": "Commit and push"
  }
]

$ ./deleteOne.sh 618615d879c8ad6d1129977d
{
  "deletedCount": 1
}

$ ./findAll.sh 
[
  {
    "_id": "618615e479c8ad6d11299e12",
    "owner_id": "6186154c79c8ad6d11294f60",
    "done": false,
    "todo": "Commit and push"
  }
]
```

As you can see, the REST API works like a charm!

## Wrap Up

Cloudflare offers a Workers [KV](https://developers.cloudflare.com/workers/runtime-apis/kv) product that _can_ make for a quick combination with Workers, but it's still a simple key-value datastore and most applications will outgrow it. By contrast, MongoDB is a powerful, full-featured database that unlocks the ability to store, query, and index your data without compromising the security or scalability of your application.

As demonstrated in this blog post, it is possible to take full advantage of both technologies. As a result, we built a powerful and secure serverless REST API that will scale very well.

> Another option for connecting to Cloudflare is the [MongoDB Atlas Data API](https://www.mongodb.com/docs/atlas/api/data-api/). The Atlas Data API provides a lightweight way to connect to MongoDB Atlas that can be thought of as similar to a REST API. To learn more, view [this tutorial](https://www.mongodb.com/developer/products/atlas/atlas-data-api-introduction/) from my fellow developer advocate Mark Smith!

If you have questions, please head to our [developer community website](https://www.mongodb.com/community/forums/) where the MongoDB engineers and the MongoDB community will help you build your next big idea with MongoDB. If your question is related to Cloudflare, I encourage you to join their [active Discord community](https://workers.community).
