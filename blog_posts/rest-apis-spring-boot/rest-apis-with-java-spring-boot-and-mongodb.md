If you want to write REST APIs in Java at the speed of light, I have what you need. I wrote [this template](https://github.com/MaBeuLux88/java-spring-boot-mongodb-starter) to get you started. I have tried to solve as many problems as possible in it.

So if you want to start writing REST APIs in Java, clone this project, and you will be up to speed in no time.

```shell
git clone https://github.com/MaBeuLux88/java-spring-boot-mongodb-starter
```

That’s all folks! All you need is in this repository. Below I will explain a few of the  features and details about this template, but feel free to skip what is not necessary for your understanding.

## README

All the extra information and commands you need to get this project going are in the `README.md` file which [you can read here](https://github.com/MaBeuLux88/java-spring-boot-mongodb-starter).

## Spring & MongoDB Configuration

The configuration can be found in the `SpringConfiguration` class.

```java
package com.mongodb.starter;

import [...]

import static org.bson.codecs.configuration.CodecRegistries.fromProviders;
import static org.bson.codecs.configuration.CodecRegistries.fromRegistries;

@Configuration
public class SpringConfiguration {

    @Value("${spring.data.mongodb.uri}")
    private String connectionString;

    @Bean
    public MongoClient mongoClient() {
        CodecRegistry pojoCodecRegistry = fromProviders(PojoCodecProvider.builder().automatic(true).build());
        CodecRegistry codecRegistry = fromRegistries(MongoClientSettings.getDefaultCodecRegistry(), pojoCodecRegistry);
        return MongoClients.create(MongoClientSettings.builder()
                                                      .applyConnectionString(new ConnectionString(connectionString))
                                                      .codecRegistry(codecRegistry)
                                                      .build());
    }

}

```

The important section here  is the MongoDB configuration of course. Firstly, you will notice the connection string is automatically retrieved from the `application.properties` file, and secondly, you will notice the configuration of the `MongoClient` bean.

A `Codec` is the interface that abstracts the processes of decoding a BSON value into a Java object and encoding a Java object into a BSON value.

A `CodecRegistry` contains a set of `Codec` instances that are accessed according to the Java classes that they encode from and decode to.

Like I said earlier, the MongoDB driver is capable of encoding and decoding BSON for us so we do not have to take care of this anymore. All the configuration we need for this project to run is here and nowhere else.

You can read [the driver documentation](https://mongodb.github.io/mongo-java-driver/3.11/bson/codecs/) if you want to know more about this topic.

## Multi-Document ACID Transactions

Just for the sake of it, I also used [multi-document ACID transactions](https://www.mongodb.com/blog/post/mongodb-multi-document-acid-transactions-general-availability) in a few methods where it could potentially make sense to use ACID transactions. You can check all the code in the `MongoDBPersonRepository` class.

Here is an example:

```java
private static final TransactionOptions txnOptions = TransactionOptions.builder()
                                                                           .readPreference(ReadPreference.primary())
                                                                           .readConcern(ReadConcern.MAJORITY)
                                                                           .writeConcern(WriteConcern.MAJORITY)
                                                                           .build();

   @Override
    public List<Person> saveAll(List<Person> persons) {
        try (ClientSession clientSession = client.startSession()) {
            return clientSession.withTransaction(() -> {
                persons.forEach(p -> p.setId(new ObjectId()));
                personCollection.insertMany(clientSession, persons);
                return persons;
            }, txnOptions);
        }
    }
```

As you can see, I’m using an auto-closeable try-with-resources which will automatically close the client session at the end. This helps me to keep the code clean and simple.

Some of you may argue that it is actually too simple because transactions (and write operations in general) can throw exceptions and I’m not handling any of them here… You are absolutely right and this is an excellent transition to the next part of this article.

## Exception Management

Transactions in MongoDB can raise exceptions for various reasons, and I don’t want to go into the details too much here but since MongoDB 3.6, any write operation that fails can be automatically retried once; and the transactions are no different. See the [documentation for retryWrites](https://docs.mongodb.com/manual/core/retryable-writes/).

If retryable writes are disabled or if a write operation failed twice then MongoDB will send a MongoException (extends RuntimeException) which should be handled properly.

Luckily, Spring provides the annotation `ExceptionHandler` to help us do that. See the code in my controller `PersonController`. Of course you will need to adapt and enhance this in your real project, but you have the main idea here.

```java
    @ExceptionHandler(RuntimeException.class)
    public final ResponseEntity<Exception> handleAllExceptions(RuntimeException e) {
        logger.error("Internal server error.", e);
        return new ResponseEntity<>(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }
```

## Aggregation Pipeline

[MongoDB's aggregation pipeline](https://docs.mongodb.com/manual/core/aggregation-pipeline/) is a very powerful and efficient way to run your complex queries as close as possible to your data for maximum efficiency. Using it can relieve the compute load on your application.

Just to give you a small example, I implemented the `/api/persons/averageAge` route to show you how I can retrieve the average age of the persons in my collection.

```java
   @Override
    public double getAverageAge() {
        List<Bson> pipeline = asList(group(new BsonNull(), avg("averageAge", "$age")), project(excludeId()));
        return personCollection.aggregate(pipeline, AverageAgeDTO.class).first().getAverageAge();
    }
```

Also, you can note here that I’m using the `personCollection` which was initially instantiated like this:

```java
MongoCollection<Person> personCollection = db.getCollection("persons", Person.class);
```

Normally my personCollection should encode and decode `Person` object only, but you can overwrite the type of object your collection is manipulating to return something different. In my case `AverageAgeDTO.class` as I’m not expecting a `Person` class here but a POJO that contains only the average age of my people.

## Swagger

[Swagger](https://swagger.io) is the tool you need to document your <a href="https://www.mongodb.com/languages/express-mongodb-rest-api-tutorial">REST APIs</a> and I have already configured it for you. You have nothing to do. Just run the server and navigate to http://localhost:8080/swagger-ui.html, the interface will be waiting for you.

![The Swagger UI](https://webassets.mongodb.com/_com_assets/cms/swaggerui-h7a9y3biw1.png "The Swagger UI")

You can test the REST APIs from this web page and explore the models. Don’t forget to disable it in production ;-).

## Nyan Cat

Yes, there is a Nyan Cat section in this blog post. Nyan Cat is love, and you need some Nyan Cat in your projects :-).
Did you know that you can replace the Spring boot logo in the logs by pretty much anything you want?

![Nyan Cat](https://webassets.mongodb.com/_com_assets/cms/nyancat-0ap95xfk4p.png "Nyan Cat")

Well now you know. You are welcome.
Have a look at  the `banner.txt` file if you want to replace this awesome Nyan Cat with your own custom logo.

In a previous company in my employment history, I was using [this website](http://patorjk.com/software/taag/#p=display&f=Epic&t=MongoDB%20is%20awesome) and the “Epic” font for each project name. It was easier to identify which log file I was currently reading.

## Conclusion

I hope you like my template, and I hope I will help you be more productive with MongoDB and the Java stack.

If you see something which can be improved, please feel free to open a Github issue or submit directly a pull request, they are very welcome :-).

If you read that far - first of all thank you - and secondly here is a $200 coupon code you can use in [MongoDB Atlas](http://bit.ly/mongodbatlas) to give this project a try in production with a dedicated MongoDB 4.2 cluster: MAXIME200.

If you are new to MongoDB Atlas, give this [Quick Start Blog Post](https://www.mongodb.com/blog/post/quick-start-getting-your-free-mongodb-atlas-cluster) a try to get up to speed with MongoDB Atlas in no time.
