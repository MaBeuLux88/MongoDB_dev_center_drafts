# Getting Started With Azure Spring Apps and MongoDB Atlas: A Step-by-Step Guide

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

I'm using Debian, so I just had to run a single command line to install the Azure CLI. Read the documentation for your
operating system.

```shell
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

Once it's installed, you should be able to run this command.

```shell
az --version 
```

It should return something like this.

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

> Note: It's normal if you don't have the Spring extension yet. We'll install it in a minute.

You can log into your Azure account using the following command.

```shell
az login
```

It should open a web browser in which you can authenticate to Azure. Then, the command should print something like this.

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

To begin with, on the home page of Azure, click on `Create a resource`.

![Create a resource][1]

Then, select Azure Spring Apps in the marketplace.

![Azure Spring Apps][2]

Create a new Azure Spring App.

![Create a new Azure Spring App][3]

Now, you can select your subscription and your resource group. Create a new one if necessary. You can also create a
service name and select the region.

![Basics to create an Azure Spring App][4]

For the other options, you can use your best judgment depending on your situation but here is what I did for this
tutorial, which isn't meant for production use...

- Basics:
    - Hosting: "Basic" (not for production use, but it's fine for me)
    - Zone Redundant: Disable
    - Deploy sample project: No
- Diagnostic settings:
    - Enable by default.
- Application Insights:
    - Disable (You probably want to keep this in production)
- Networking:
    - Deploy in your own virtual network: No
- Tags:
    - I didn't add any

Here is my `Review and create` summary:

![Review and create][5]

Once you are happy, click on `Create` and wait a minute for your deployment to be ready to use.

## Prepare our Spring application

In this tutorial, we are deploying
this [Java, Spring Boot, and MongoDB template](https://github.com/mongodb-developer/java-spring-boot-mongodb-starter),
available on GitHub. If you want to learn more about this template, you can read
my [article](https://www.mongodb.com/developer/code-examples/java/rest-apis-java-spring-boot/), but in a few words:
It's a simple [CRUD](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete) Spring application that manages
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

![Go to resource][6]

Now, we can create our first microservice. Click on `Create App`.

![Create app][7]

Insert a name for your application, select Java 17, and click `Create`.

![Go to resource][8]

You can now access your new microservice.

![Access your microservice][9]

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

![Create a new environment variable][10]

> Note: If you don't have a [database user](https://www.mongodb.com/docs/atlas/security-add-mongodb-users/), it's time
> to create one and use the login and password in your connection string.

## Atlas network access

MongoDB Atlas clusters only accept TCP connections from known IP addresses.

As our Spring application will try to connect to our MongoDB cluster, we need to add the IP address of our microservice
in the Atlas Network Access list.

- Retrieve the outbound IP address in the `Networking` tab of our Azure Spring App.

![Retrieve the outbound IP address][11]

- Add this IP address to the network access list in Atlas.

![Add IP address in the Network Access list in Atlas][12]

## Deploy our microservice

We can now deploy our JAR file!

Click on the `Apps` tab and `Deploy app`.

![Deploy app tab][13]

You'll see the instructions to deploy your application.

![Deploy app instructions][14]

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

![Microservice deployed][15]

## Assign an endpoint

Finally, we need to assign an endpoint to our service to start discussing with the REST API.

![Assign endpoint][16]

Retrieve the endpoint to test the REST API. For me, it's:

![Retrieve endpoint][17]

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

![persons collection in MongoDB Atlas][18]

And because this project also
uses [Swagger and OpenAPI3](https://github.com/mongodb-developer/java-spring-boot-mongodb-starter?tab=readme-ov-file#swagger--openapi-3),
you can access the Swagger UI here:

```
https://<YOUR_ENDPOINT>/swagger-ui/index.html
```

![Swagger UI][19]

## Conclusion

And that's a wrap! You've smoothly navigated the realms of Azure Spring Apps and MongoDB, crafting a dynamic Spring Boot
application in the Azure Cloud. Your microservice is up, the REST API is ready, and MongoDB is seamlessly managing your
data.

Consider creating a [free Atlas cluster](https://www.mongodb.com/atlas/database) and start exploring all the features
MongoDB Atlas has to offer.

Got questions or itching to share your success? Head over to
the [MongoDB Community Forum](https://www.mongodb.com/community/forums/) – we're all ears and ready to help!

Cheers to your successful deployment, and here's to the exciting ventures ahead! Happy coding! 🚀


[1]: https://images.contentstack.io/v3/assets/blt39790b633ee0d5a7/blt85b83d544dd0ca8a/65b1e83a5cdaec024a3b7504/1_Azure_create_resource.png

[2]: https://images.contentstack.io/v3/assets/blt39790b633ee0d5a7/bltbb51a0462dcbee8f/65b1e83a60a275d0957fb596/2_Azure_marketplace.png

[3]: https://images.contentstack.io/v3/assets/blt39790b633ee0d5a7/bltf3dd72fc38c1ebb6/65b1e83a24ea49f803de48b9/3_Azure_create_spring_app.png

[4]: https://images.contentstack.io/v3/assets/blt39790b633ee0d5a7/bltba32459974d4333e/65b1e83a5f12edbad7e207d2/4_Azure_create_spring_app_basics.png

[5]: https://images.contentstack.io/v3/assets/blt39790b633ee0d5a7/bltc13b9d359d2bea5d/65b1e83ad2067b1eef8c361a/5_Azure_review_create.png

[6]: https://images.contentstack.io/v3/assets/blt39790b633ee0d5a7/blt6c07487ae8a39b3a/65b1e83ae5c1f348ced943b7/6_Azure_go_to_resource.png

[7]: https://images.contentstack.io/v3/assets/blt39790b633ee0d5a7/blt37a00fe46791bb41/65b1e83a292a0e1bf887c012/7_Azure_create_app.png

[8]: https://images.contentstack.io/v3/assets/blt39790b633ee0d5a7/blt402b5ddcf552ae28/65b1e83ad2067bb08b8c361e/8_Azure_create_app_details.png

[9]: https://images.contentstack.io/v3/assets/blt39790b633ee0d5a7/bltf0d1d7e1a2d3aa85/65b1e83a7d4ae76ad397f177/9_Azure_access_new_microservice.png

[10]: https://images.contentstack.io/v3/assets/blt39790b633ee0d5a7/bltb238d1ab52de83f7/65b1e83a292a0e6c2c87c016/10_Azure_env_variable_mdb_uri.png

[11]: https://images.contentstack.io/v3/assets/blt39790b633ee0d5a7/blt67bc373d0b45280e/65b1e83a5cdaec4f253b7508/11_Azure_networking_outbound.png

[12]: https://images.contentstack.io/v3/assets/blt39790b633ee0d5a7/blt18a1a75423ce4fb4/65b1e83bc025eeec67b86d13/12_Azure_networking_Atlas.png

[13]: https://images.contentstack.io/v3/assets/blt39790b633ee0d5a7/bltdeb250a7e04c891b/65b1e83a41400c0b1b4571e0/13_Azure_deploy_app_tab.png

[14]: https://images.contentstack.io/v3/assets/blt39790b633ee0d5a7/blt390946eab49df898/65b1e83a7d4ae73fbb97f17b/14_Azure_deploy_app.png

[15]: https://images.contentstack.io/v3/assets/blt39790b633ee0d5a7/blt7a33fb264f9fdc6f/65b1e83ac025ee08acb86d0f/15_Azure_app_deployed.png

[16]: https://images.contentstack.io/v3/assets/blt39790b633ee0d5a7/blt2d899245c14fb006/65b1e83b92740682adeb573b/16_Azure_assign_endpoint.png

[17]: https://images.contentstack.io/v3/assets/blt39790b633ee0d5a7/bltc531bc65df82614b/65b1e83a450fa426730157f0/17_Azure_endpoint.png

[18]: https://images.contentstack.io/v3/assets/blt39790b633ee0d5a7/blt6bf26487ac872753/65b1e83a41400c1b014571e4/18_Azure_Atlas_doc.png

[19]: https://images.contentstack.io/v3/assets/blt39790b633ee0d5a7/blt39ced6072046b686/65b1e83ad2067b0f2b8c3622/19_Azure_Swagger.png
