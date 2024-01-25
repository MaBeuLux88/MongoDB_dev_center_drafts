## Introduction

Embrace the fusion of cloud computing and modern application development as we delve into the integration of [Azure
Spring Apps](https://azure.microsoft.com/en-us/products/spring-apps)
and [MongoDB](https://www.mongodb.com/atlas/database). In this tutorial, we'll guide you through the process of creating
and deploying a Spring Boot
application in the Azure Cloud, leveraging the strengths of Azure's platform, Spring Boot's simplicity, and MongoDB's
capabilities.

Whether you're a developer venturing into the cloud landscape or looking to refine your cloud-native skills, this
step-by-step guide provides a concise roadmap. By the end of this journey, you'll have a fully functional [Spring Boot
application](https://github.com/mongodb-developer/java-spring-boot-mongodb-starter) seamlessly running on Azure Spring
Apps, with MongoDB handling your data storage needs and a REST API ready
for interaction. Let's explore the synergy of these technologies and propel your cloud-native endeavors forward.

## Prerequisites

- Java 17
- Maven 3.8.7
- Git (or you can download the zip folder and unzip it locally)
- [MongoDB Atlas](https://cloud.mongodb.com/) cluster (the M0 free tier is enough for this tutorial). If you don't have
  one, you can [create one for free](https://www.mongodb.com/atlas/database).
- Access to your [Azure account](http://portal.azure.com/) with enough permissions to start a new Spring App.
- [Install the Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest) to be
  able to deploy your Azure Spring App.

I'm using Debian, so I just had to run a single command line to install the Azure CLI. Read the documentation for your operating system.

```shell
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

Once it's installed, you should be able to run this command.

```shell
az --version 
```

Which should return something like this.

```
azure-cli                         2.56.0

core                              2.56.0
telemetry                          1.1.0

Extensions:
spring                            1.19.2

Dependencies:
msal                            1.24.0b2
azure-mgmt-resource             23.1.0b2

Python location '/opt/az/bin/python3'
Extensions directory '/home/polux/.azure/cliextensions'

Python (Linux) 3.11.5 (main, Jan  8 2024, 09:08:48) [GCC 12.2.0]

Legal docs and information: aka.ms/AzureCliLegal


Your CLI is up-to-date.
```

> Note: It's normal if you don't have the Spring extension yet, we'll install it in a minute.

You can log into your Azure account using the following command.

```shell
az login
```

It should open a web browser in which you can authenticate to Azure. Then the command should print something like this.

```json
[
  {
    "cloudName": "AzureCloud",
    "homeTenantId": "<MY_TENANT_ID>",
    "id": "<MY_SUBSCRIPTION_ID>",
    "isDefault": true,
    "managedByTenants": [],
    "name": "MDB-DevRel",
    "state": "Enabled",
    "tenantId": "<MY_TENANT_ID>",
    "user": {
      "name": "maxime.beugnet@mongodb.com",
      "type": "user"
    }
  }
]
```

Once you are logged into your Azure account, you can type the following command to install the Spring extension.

```shell
az extension add -n spring
```

## Create a new Azure Spring App

To begin with, in the home page of Azure, click on `Create a resource`.

![Create a resource](images/1_Azure_create_resource.png)

Then select Azure Spring Apps in the marketplace.

![Azure Spring Apps](images/2_Azure_marketplace.png)

Then create a new Azure Spring App.

![Create a new Azure Spring App](images/3_Azure_create_spring_app.png)

Now you can select your subscription and your resource group. Create a new one if necessary. You can also create a
service name and select the region.

![Basics to create an Azure Spring App](images/4_Azure_create_spring_app_basics.png)

For the other options, you can use your best judgement depending on your situation but here is what I did for this
tutorial which isn't meant for production use...

- Basics:
    - Hosting: "Basic" (not for production use, but it's fine for me).
    - Zone Redundant: Disable.
    - Deploy sample project: No.
- Diagnostic settings:
    - Enable by default.
- Application Insights:
    - Disable (You probably want to keep this in production).
- Networking:
    - Deploy in your own virtual network: No.
- Tags:
    - I didn't add any.

Here is my `Review and create` summary:

![Review and create](images/5_Azure_review_create.png)

Once you are happy, click on `Create` and wait a minute for your deployment to be ready to use.

## Prepare our Spring application

In this tutorial, we are deploying
this [Java, Spring Boot & MongoDB Template](https://github.com/mongodb-developer/java-spring-boot-mongodb-starter)
available on GitHub. If you want to learn more about this template, you can read
my [blog post](https://www.mongodb.com/developer/code-examples/java/rest-apis-java-spring-boot/) but in a few words:
it's a simple [CRUD](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete) Spring application that manages
a `persons` collection, stored in MongoDB with a REST API.

- Clone or download a zip of this repository.

```shell
git clone git@github.com:mongodb-developer/java-spring-boot-mongodb-starter.git
```

- Package this project in a [fat JAR](https://stackoverflow.com/questions/19150811/what-is-a-fat-jar).

```shell
cd java-spring-boot-mongodb-starter
mvn clean package
```

If everything went as planned, you should now have a JAR file available in your `target` folder
named `java-spring-boot-mongodb-starter-1.0.0.jar`.

## Create our microservice

In Azure, you can now click on `Go to resource` to access your new Azure Spring App.

![Go to resource](images/6_Azure_go_to_resource.png)

Now we can create our first microservice. Click on `Create App`.

![Create app](images/7_Azure_create_app.png)

Insert a name for your application and select Java 17, and click `Create`.

![Go to resource](images/8_Azure_create_app_details.png)

You can now access your new microservice.

![Access your microservice](images/9_Azure_access_new_microservice.png)

## Environment variables

In our Java project, our `application.properties` file contains the following:

```properties
spring.data.mongodb.uri=${MONGODB_URI:mongodb://localhost}
```

This means that our Spring application will try to find a MongoDB URI in the `MONGODB_URI` environment variable first,
and will default to `mongodb://localhost` if it doesn't exist.

As we want to connect our microservice to our cluster in MongoDB Atlas, we have to set this environment variable
correctly.

- In MongoDB Atlas, [retrieve your connection string](https://www.mongodb.com/docs/guides/atlas/connection-string/) for
  the Java driver. It should look like this:

```
mongodb+srv://user:password@free.ab12c.mongodb.net/?retryWrites=true&w=majority
```

- Create a new environment variable in your configuration.

![Create a new environment variable](images/10_Azure_env_variable_mdb_uri.png)

> Note: If you don't have a [database user](https://www.mongodb.com/docs/atlas/security-add-mongodb-users/), it's time
> to create one and use the login & password in your connection string.

## Atlas network access

MongoDB Atlas clusters only accepts TCP connections from known IP addresses.

As our Spring Application will try to connect to our MongoDB Cluster, we need to add the IP address of our microservice
in the Atlas Network Access list.

- Retrieve the outbound IP address in the `Networking` tab of our Azure Spring App.

![Retrieve the outbound IP address](images/11_Azure_networking_outbound.png)

- Add this IP address in the network access list in Atlas.

![Add IP address in the Network Access list in Atlas](images/12_Azure_networking_Atlas.png)

## Deploy our microservice

We can now deploy our JAR file!

Click on the `Apps` tab and `Deploy app`.

![Deploy app tab](images/13_Azure_deploy_app_tab.png)

You'll see the instructions to deploy your application.

![Deploy app instructions](images/14_Azure_deploy_app.png)

- We have to set our `Subscription ID`:

```shell
az account set -s <SUBSCRIPTION_ID>
```

- We can deploy!

```shell
az spring app deploy -s mongodb-spring-apps -g MaximeSpringApps -n mongodb-persons-app --artifact-path target/java-spring-boot-mongodb-starter-1.0.0.jar
```

If everything went well, you should see some logs happily telling you that the Spring app fired up successfully and
hooked up with our MongoDB Atlas cluster.

![Microservice deployed](images/15_Azure_app_deployed.png)

## Assign an endpoint

Finally, we need to assign an endpoint to our service to start discussing with the REST API.

![Assign endpoint](images/16_Azure_assign_endpoint.png)

Retrieve the endpoint to test the REST API. For me, it's:

![Retrieve endpoint](images/17_Azure_endpoint.png)

```
https://mongodb-spring-apps-mongodb-persons-app.azuremicroservices.io
```

## Test the REST API

You can create a `person` using the following `cURL` command. Don't forget to change the endpoint.

```shell
curl -X 'POST' \
  'https://mongodb-spring-apps-mongodb-persons-app.azuremicroservices.io/api/person' \
  -H 'accept: */*' \
  -H 'Content-Type: application/json' \
  -d '{
  "firstName": "Maxime",
  "lastName": "Beugnet",
  "age": 35,
  "address": {
    "number": 123,
    "street": "rue de la Paix",
    "postcode": "75000",
    "city": "Paris",
    "country": "France"
  },
  "insurance": true,
  "cars": [
    {
      "brand": "Peugeot",
      "model": "3008",
      "maxSpeedKmH": 280
    }
  ]
}'
```

You can retrieve the persons from the MongoDB cluster in Atlas using the following `cURL` command.

```shell
curl "https://mongodb-spring-apps-mongodb-persons-app.azuremicroservices.io/api/persons"
```

Which should print something like this.

```json
[
  {
    "id": "65adc7d0a227f7388c594704",
    "firstName": "Maxime",
    "lastName": "Beugnet",
    "age": 35,
    "address": {
      "number": 123,
      "street": "rue de la Paix",
      "postcode": "75000",
      "city": "Paris",
      "country": "France"
    },
    "createdAt": "2024-01-22T01:55:23.093+00:00",
    "insurance": true,
    "cars": [
      {
        "brand": "Peugeot",
        "model": "3008",
        "maxSpeedKmH": 280.0
      }
    ]
  }
]
```

In our MongoDB Atlas cluster, we can confirm that the data was saved correctly.

![persons collection in MongoDB Atlas](images/18_Azure_Atlas_doc.png)

And because this project also uses [Swagger and OpenAPI3](https://github.com/mongodb-developer/java-spring-boot-mongodb-starter?tab=readme-ov-file#swagger--openapi-3), you can access the Swagger UI here: 

```
https://<YOUR_ENDPOINT>/swagger-ui/index.html
```

![Swagger UI](images/19_Azure_Swagger.png)

## Conclusion

And that's a wrap! You've smoothly navigated the realms of Azure Spring Apps and MongoDB, crafting a dynamic Spring Boot application in the Azure Cloud. Your microservice is up, the REST API is ready, and MongoDB is seamlessly managing your data.

Consider creating a [free Atlas cluster](https://www.mongodb.com/atlas/database) and start exploring all the features MongoDB Atlas has to offer.

Got questions or itching to share your success? Head over to the MongoDB Community Forum at https://www.mongodb.com/community/forums/ – we're all ears and ready to help!

Cheers to your successful deployment, and here's to the exciting ventures ahead! Happy coding! 🚀
