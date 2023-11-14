## Updates

The MongoDB Java quickstart repository is [available on GitHub](https://github.com/mongodb-developer/java-quick-start).

### November 14th, 2023

- Update to Java 17
- Update Java Driver to 4.11.1
- Update mongodb-crypt to 1.8.0

### March 25th, 2021

- Update Java Driver to 4.2.2.
- Added Client Side Field Level Encryption example.

### October 21st, 2020

- Update Java Driver to 4.1.1.
- The MongoDB Java Driver logging is now enabled via the popular [SLF4J](http://www.slf4j.org/) API, so I added logback
  in the `pom.xml` and a configuration file `logback.xml`.

## Introduction

<div>
    <img
        style="float: right;
        border-radius: 10px;
        margin-bottom: 30px;
        vertical-align: bottom;
        width: 30%;"
        src="https://mongodb-devhub-cms.s3.us-west-1.amazonaws.com/old_images/qs-badges/qs-badge-java.png" alt="Java badge" />

In this very first blog post of the Java Quick Start series, I will show you how to set up your Java project with Maven
and execute a MongoDB command in Java. Then, we will explore the most common operations — such as create, read, update,
and delete — using the [MongoDB Java driver](https://www.mongodb.com/docs/drivers/java-drivers/). I will also show you
some of the more powerful options and features available as part of the
MongoDB [Java driver](https://www.mongodb.com/docs/drivers/java/sync/current/compatibility/) for each of these
operations, giving you a really great foundation of knowledge to build upon as we go through the series.
</div>

In future blog posts, we will move on and work through:

- [Mapping MongoDB BSON documents directly to Plain Old Java Object (POJO)](/developer/languages/java/java-mapping-pojos/)
- [The MongoDB Aggregation Framework](/developer/languages/java/java-aggregation-pipeline/)
- [Change Streams](/developer/languages/java/java-change-streams/)
- [Multi-document ACID transactions](https://www.mongodb.com/blog/post/java-and-mongodb-40-support-for-multidocument-acid-transactions)
- The MongoDB Java reactive streams driver

### Why MongoDB and Java?

Java is the [most popular language in the IT industry](https://stackify.com/popular-programming-languages-2018/) at the
date of this blog post,
and [developers voted MongoDB as their most wanted database four years in a row](https://www.mongodb.com/blog/post/mongodb-the-most-wanted-database-by-developers-for-the-4th-consecutive-year).
In this series of blog posts, I will be demonstrating how powerful these two great pieces of technology are when
combined and how you can access that power.

### Prerequisites

To follow along, you can use any environment you like and the integrated development environment of your choice. I'll
use [Maven](http://maven.apache.org/install.html) 3.8.7 and the Java OpenJDK 17, but it's fairly easy to update the code
to support older versions of Java, so feel free to use the JDK of your choice and update the Java version accordingly in
the pom.xml file we are about to set up.

For the MongoDB cluster, we will be using a M0 Free Tier MongoDB Cluster
from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/). If you don't have one already, check out
my [Get Started with an M0 Cluster](/developer/products/atlas/free-atlas-cluster/) blog post.

> Get your free M0 cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/) today. It's free forever, and you'll
> be able to use it to work with the examples in this blog series.

Let's jump in and take a look at how well Java and MongoDB work together.

## Getting set up

To begin with, we will need to set up a new Maven project. You have two options at this point. You can either clone this
series' git repository or you can create and set up the Maven project.

### Using the git repository

If you choose to use git, you will get all the code immediately. I still recommend you read through the manual set-up.

You can clone the repository if you like with the following command.

``` bash
git clone git@github.com:mongodb-developer/java-quick-start.git
```

Or you
can [download the repository as a zip file](https://github.com/mongodb-developer/java-quick-start/archive/master.zip).

### Setting up manually

You can either use your favorite IDE to create a new Maven project for you or you can create the Maven project manually.
Either way, you should get the following folder architecture:

``` none
java-quick-start/
├── pom.xml
└── src
    └── main
        └── java
            └── com
                └── mongodb
                    └── quickstart
```

The pom.xml file should contain the following code:

``` xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xmlns="http://maven.apache.org/POM/4.0.0"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.mongodb</groupId>
    <artifactId>java-quick-start</artifactId>
    <version>1.0-SNAPSHOT</version>

    <properties>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <maven-compiler-plugin.source>17</maven-compiler-plugin.source>
        <maven-compiler-plugin.target>17</maven-compiler-plugin.target>
        <maven-compiler-plugin.version>3.11.0</maven-compiler-plugin.version>
        <mongodb-driver-sync.version>4.11.1</mongodb-driver-sync.version>
        <mongodb-crypt.version>1.8.0</mongodb-crypt.version>
        <!-- Have to keep version 1.2.12 because slf4j-api isn't optional in mongodb-crypt and is using an old version. -->
        <!-- See https://jira.mongodb.org/browse/JAVA-5240 for a workaround-->
        <logback-classic.version>1.2.12</logback-classic.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.mongodb</groupId>
            <artifactId>mongodb-driver-sync</artifactId>
            <version>${mongodb-driver-sync.version}</version>
        </dependency>
        <dependency>
            <groupId>org.mongodb</groupId>
            <artifactId>mongodb-crypt</artifactId>
            <version>${mongodb-crypt.version}</version>
        </dependency>
        <dependency>
            <groupId>ch.qos.logback</groupId>
            <artifactId>logback-classic</artifactId>
            <version>${logback-classic.version}</version>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>${maven-compiler-plugin.version}</version>
                <configuration>
                    <source>${maven-compiler-plugin.source}</source>
                    <target>${maven-compiler-plugin.target}</target>
                </configuration>
            </plugin>
        </plugins>
    </build>

</project>

```

To verify that everything works correctly, you should be able to create and run a simple "Hello MongoDB!" program.
In `src/main/java/com/mongodb/quickstart`, create the `HelloMongoDB.java` file:

``` java
package com.mongodb.quickstart;

public class HelloMongoDB {

    public static void main(String[] args) {
        System.out.println("Hello MongoDB!");
    }
}
```

Then compile and execute it with your IDE or use the command line in the root directory (where the `src` folder is):

``` bash
mvn compile exec:java -Dexec.mainClass="com.mongodb.quickstart.HelloMongoDB"
```

The result should look like this:

``` none
[INFO] Scanning for projects...
[INFO] 
[INFO] --------------------< com.mongodb:java-quick-start >--------------------
[INFO] Building java-quick-start 1.0-SNAPSHOT
[INFO] --------------------------------[ jar ]---------------------------------
[INFO] 
[INFO] --- maven-resources-plugin:2.6:resources (default-resources) @ java-quick-start ---
[INFO] Using 'UTF-8' encoding to copy filtered resources.
[INFO] Copying 1 resource
[INFO] 
[INFO] --- maven-compiler-plugin:3.11.0:compile (default-compile) @ java-quick-start ---
[INFO] Nothing to compile - all classes are up to date
[INFO] 
[INFO] --- exec-maven-plugin:3.1.0:java (default-cli) @ java-quick-start ---
Hello MongoDB!
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  0.269 s
[INFO] Finished at: 2023-11-13T21:31:16+01:00
[INFO] ------------------------------------------------------------------------

```

## Connecting with Java

Now that our Maven project works, we have resolved our dependencies, we can start using MongoDB Atlas with Java.

If you have imported the [sample dataset](/developer/products/atlas/atlas-sample-datasets/) as suggested in
the [Quick Start Atlas blog post](/developer/products/atlas/free-atlas-cluster/), then with the Java code we are about
to create, you will be able to see a list of the databases in the sample dataset.

The first step is to instantiate a `MongoClient` by passing a MongoDB Atlas connection string into
the `MongoClients.create()` static method. This will establish a connection
to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/) using the connection string. Then we can retrieve the list of
databases on this cluster and print them out to test the connection with MongoDB.

As per the recommended best practices, I'm also doing a "pre-flight check" using the `{ping: 1}` admin command.

In `src/main/java/com/mongodb`, create the `Connection.java` file:

``` java
package com.mongodb.quickstart;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import org.bson.Document;
import org.bson.json.JsonWriterSettings;

import java.util.ArrayList;
import java.util.List;

public class Connection {

    public static void main(String[] args) {
        String connectionString = System.getProperty("mongodb.uri");
        try (MongoClient mongoClient = MongoClients.create(connectionString)) {
            System.out.println("=> Connection successful: " + preFlightChecks(mongoClient));
            System.out.println("=> Print list of databases:");
            List<Document> databases = mongoClient.listDatabases().into(new ArrayList<>());
            databases.forEach(db -> System.out.println(db.toJson()));
        }
    }

    static boolean preFlightChecks(MongoClient mongoClient) {
        Document pingCommand = new Document("ping", 1);
        Document response = mongoClient.getDatabase("admin").runCommand(pingCommand);
        System.out.println("=> Print result of the '{ping: 1}' command.");
        System.out.println(response.toJson(JsonWriterSettings.builder().indent(true).build()));
        return response.getDouble("ok").equals(1.0);
    }
}

```

As you can see, the MongoDB connection string is retrieved from the *System Properties*, so we need to set this up. Once
you have retrieved your [MongoDB Atlas connection string](https://docs.mongodb.com/guides/cloud/connectionstring/), you
can add the `mongodb.uri` system property into your IDE. Here is my configuration with IntelliJ for example.

![IntelliJ Configuration](https://mongodb-devhub-cms.s3.us-west-1.amazonaws.com/old_images/intellij-configuration.png "IntelliJ Configuration")

Or if you prefer to use Maven in command line, here is the equivalent command line you can run in the root directory:

``` bash
mvn compile exec:java -Dexec.mainClass="com.mongodb.quickstart.Connection" -Dmongodb.uri="mongodb+srv://username:password@cluster0-abcde.mongodb.net/test?w=majority" -Dexec.cleanupDaemonThreads=false
```

> Note: Don't forget the double quotes around the MongoDB URI to avoid surprises from your shell.

The standard output should look like this:

``` none
{"name": "admin", "sizeOnDisk": 303104.0, "empty": false}
{"name": "config", "sizeOnDisk": 147456.0, "empty": false}
{"name": "local", "sizeOnDisk": 5.44731136E8, "empty": false}
{"name": "sample_airbnb", "sizeOnDisk": 5.761024E7, "empty": false}
{"name": "sample_geospatial", "sizeOnDisk": 1384448.0, "empty": false}
{"name": "sample_mflix", "sizeOnDisk": 4.583424E7, "empty": false}
{"name": "sample_supplies", "sizeOnDisk": 1339392.0, "empty": false}
{"name": "sample_training", "sizeOnDisk": 7.4801152E7, "empty": false}
{"name": "sample_weatherdata", "sizeOnDisk": 5103616.0, "empty": false}
```

## Insert operations

### Getting set up

In the Connecting with Java section, we created the classes `HelloMongoDB` and `Connection`. Now we will work on
the `Create` class.

If you didn't set up your free cluster on MongoDB Atlas, now is great time to do so. Get the directions
for [creating your cluster](/developer/products/atlas/free-atlas-cluster/).

### Checking the collection and data model

In the sample dataset, you can find the database `sample_training`, which contains a collection `grades`. Each document
in this collection represents a student's grades for a particular class.

Here is the JSON representation of a document in the [MongoDB shell](https://www.mongodb.com/docs/mongodb-shell/).

``` bash
MongoDB Enterprise Cluster0-shard-0:PRIMARY> db.grades.findOne({student_id: 0, class_id: 339})
{
    "_id" : ObjectId("56d5f7eb604eb380b0d8d8ce"),
    "student_id" : 0,
    "scores" : [
        {
            "type" : "exam",
            "score" : 78.40446309504266
        },
        {
            "type" : "quiz",
            "score" : 73.36224783231339
        },
        {
            "type" : "homework",
            "score" : 46.980982486720535
        },
        {
            "type" : "homework",
            "score" : 76.67556138656222
        }
    ],
    "class_id" : 339
}
```

And here is the [extended JSON](https://docs.mongodb.com/manual/reference/mongodb-extended-json/) representation of the
same student. You can retrieve it in [MongoDB Compass](https://www.mongodb.com/products/compass), our free GUI tool, if
you want.

Extended JSON is the human-readable version of a BSON document without loss of type information. You can read more about
the Java driver and
BSON [in the MongoDB Java driver documentation](https://mongodb.github.io/mongo-java-driver/3.11/bson/extended-json/).

``` json
{
    "_id": {
        "$oid": "56d5f7eb604eb380b0d8d8ce"
    },
    "student_id": {
        "$numberDouble": "0"
    },
    "scores": [{
        "type": "exam",
        "score": {
            "$numberDouble": "78.40446309504266"
        }
    }, {
        "type": "quiz",
        "score": {
            "$numberDouble": "73.36224783231339"
        }
    }, {
        "type": "homework",
        "score": {
            "$numberDouble": "46.980982486720535"
        }
    }, {
        "type": "homework",
        "score": {
            "$numberDouble": "76.67556138656222"
        }
    }],
    "class_id": {
        "$numberDouble": "339"
    }
}
```

As you can see, MongoDB stores BSON documents and for each key-value pair, the BSON contains the key and the value along
with its type. This is how MongoDB knows that `class_id` is actually a double and not an integer, which is not explicit
in the mongo shell representation of this document.

We have 10,000 students (`student_id` from 0 to 9999) already in this collection and each of them took 10 different
classes, which adds up to 100,000 documents in this collection. Let's say a new student (`student_id` 10,000) just
arrived in this university and received a bunch of (random) grades in his first class. Let's insert this new student
document using Java and the MongoDB Java driver.

In this university, the `class_id` varies from 0 to 500, so I can use any random value between 0 and 500.

### Selecting databases and collections

Firstly, we need to set up our `Create` class and access this `sample_training.grades` collection.

``` java
package com.mongodb.quickstart;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;

public class Create {

    public static void main(String[] args) {
        try (MongoClient mongoClient = MongoClients.create(System.getProperty("mongodb.uri"))) {

            MongoDatabase sampleTrainingDB = mongoClient.getDatabase("sample_training");
            MongoCollection<Document> gradesCollection = sampleTrainingDB.getCollection("grades");

        }
    }
}
```

### Create a BSON document

Secondly, we need to represent this new student in Java using the `Document` class.

``` java
Random rand = new Random();
Document student = new Document("_id", new ObjectId());
student.append("student_id", 10000d)
       .append("class_id", 1d)
       .append("scores", asList(new Document("type", "exam").append("score", rand.nextDouble() * 100),
                                new Document("type", "quiz").append("score", rand.nextDouble() * 100),
                                new Document("type", "homework").append("score", rand.nextDouble() * 100),
                                new Document("type", "homework").append("score", rand.nextDouble() * 100)));
```

As you can see, we reproduced the same data model from the existing documents in this collection as we made sure
that `student_id`, `class_id`, and `score` are all doubles.

Also, the Java driver would have generated the `_id` field with an ObjectId for us if we didn't explicitly create one
here, but it's good practice to set the `_id` ourselves. This won't change our life right now, but it makes more sense
when we directly manipulate POJOs, and we want to create a clean REST API. I'm doing this in
my [mapping POJOs post](/developer/languages/java/java-mapping-pojos/).

Note as well that we are inserting a document into an existing collection and database, but if these didn't already
exist, MongoDB would automatically create them the first time you to go insert a document into the collection.

### Insert document

Finally, we can insert this document.

``` java
gradesCollection.insertOne(student);
```

### Final code to insert one document

Here is the final `Create` class to insert one document in MongoDB with all the details I mentioned above.

``` java
package com.mongodb.quickstart;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;
import org.bson.types.ObjectId;

import java.util.Random;

import static java.util.Arrays.asList;

public class Create {

    public static void main(String[] args) {
        try (MongoClient mongoClient = MongoClients.create(System.getProperty("mongodb.uri"))) {

            MongoDatabase sampleTrainingDB = mongoClient.getDatabase("sample_training");
            MongoCollection<Document> gradesCollection = sampleTrainingDB.getCollection("grades");

            Random rand = new Random();
            Document student = new Document("_id", new ObjectId());
            student.append("student_id", 10000d)
                   .append("class_id", 1d)
                   .append("scores", asList(new Document("type", "exam").append("score", rand.nextDouble() * 100),
                                            new Document("type", "quiz").append("score", rand.nextDouble() * 100),
                                            new Document("type", "homework").append("score", rand.nextDouble() * 100),
                                            new Document("type", "homework").append("score", rand.nextDouble() * 100)));

            gradesCollection.insertOne(student);
        }
    }
}
```

You can execute this class with the following Maven command line in the root directory or using your IDE (see above for
more details). Don't forget the double quotes around the MongoDB URI to avoid surprises.

``` bash
mvn compile exec:java -Dexec.mainClass="com.mongodb.quickstart.Create" -Dmongodb.uri="mongodb+srv://USERNAME:PASSWORD@cluster0-abcde.mongodb.net/test?w=majority" -Dexec.cleanupDaemonThreads=false
```

And here is the document I extracted from [MongoDB
Compass](https://www.mongodb.com/products/compass).

``` json
{
    "_id": {
        "$oid": "5d97c375ded5651ea3462d0f"
    },
    "student_id": {
        "$numberDouble": "10000"
    },
    "class_id": {
        "$numberDouble": "1"
    },
    "scores": [{
        "type": "exam",
        "score": {
            "$numberDouble": "4.615256396625178"
        }
    }, {
        "type": "quiz",
        "score": {
            "$numberDouble": "73.06173415145801"
        }
    }, {
        "type": "homework",
        "score": {
            "$numberDouble": "19.378205578990727"
        }
    }, {
        "type": "homework",
        "score": {
            "$numberDouble": "82.3089189278531"
        }
    }]
}
```

Note that the order of the fields is different from the initial document with `"student_id": 0`.

We could get exactly the same order if we wanted to by creating the document like this.

``` java
Random rand = new Random();
Document student = new Document("_id", new ObjectId());
student.append("student_id", 10000d)
       .append("scores", asList(new Document("type", "exam").append("score", rand.nextDouble() * 100),
                                new Document("type", "quiz").append("score", rand.nextDouble() * 100),
                                new Document("type", "homework").append("score", rand.nextDouble() * 100),
                                new Document("type", "homework").append("score", rand.nextDouble() * 100)))
       .append("class_id", 1d);
```

But if you do things correctly, this should not have any impact on your code and logic as fields in JSON documents are
not ordered.

I'm quoting [json.org](http://json.org/) for this:

> An object is an unordered set of name/value pairs.

### Insert multiple documents

Now that we know how to create one document, let's learn how to insert many documents.

Of course, we could just wrap the previous `insert` operation into a `for` loop. Indeed, if we loop 10 times on this
method, we would send 10 insert commands to the cluster and expect 10 insert acknowledgments. As you can imagine, this
would not be very efficient as it would generate a lot more TCP communications than necessary.

Instead, we want to wrap our 10 documents and send them in one call to the cluster and we want to receive only one
insert acknowledgement for the entire list.

Let's refactor the code. First, let's make the random generator a `private static final` field.

``` java
private static final Random rand = new Random();
```

Let's make a grade factory method.

``` java
private static Document generateNewGrade(double studentId, double classId) {
    List<Document> scores = asList(new Document("type", "exam").append("score", rand.nextDouble() * 100),
                                   new Document("type", "quiz").append("score", rand.nextDouble() * 100),
                                   new Document("type", "homework").append("score", rand.nextDouble() * 100),
                                   new Document("type", "homework").append("score", rand.nextDouble() * 100));
    return new Document("_id", new ObjectId()).append("student_id", studentId)
                                              .append("class_id", classId)
                                              .append("scores", scores);
}
```

And now we can use this to insert 10 documents all at once.

``` java
List<Document> grades = new ArrayList<>();
for (double classId = 1d; classId <= 10d; classId++) {
    grades.add(generateNewGrade(10001d, classId));
}

gradesCollection.insertMany(grades, new InsertManyOptions().ordered(false));
```

As you can see, we are now wrapping our grade documents into a list and we are sending this list in a single call with
the `insertMany` method.

By default, the `insertMany` method will insert the documents in order and stop if an error occurs during the process.
For example, if you try to insert a new document with the same `_id` as an existing document, you would get
a `DuplicateKeyException`.

Therefore, with an ordered `insertMany`, the last documents of the list would not be inserted and the insertion process
would stop and return the appropriate exception as soon as the error occurs.

As you can see here, this is not the behaviour we want because all the grades are completely independent from one to
another. So, if one of them fails, we want to process all the grades and then eventually fall back to an exception for
the ones that failed.

This is why you see the second parameter `new InsertManyOptions().ordered(false)` which is true by default.

### The final code to insert multiple documents

Let's refactor the code a bit and here is the final `Create` class.

``` java
package com.mongodb.quickstart;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.InsertManyOptions;
import org.bson.Document;
import org.bson.types.ObjectId;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public class Create {

    private static final Random rand = new Random();

    public static void main(String[] args) {
        try (MongoClient mongoClient = MongoClients.create(System.getProperty("mongodb.uri"))) {

            MongoDatabase sampleTrainingDB = mongoClient.getDatabase("sample_training");
            MongoCollection<Document> gradesCollection = sampleTrainingDB.getCollection("grades");

            insertOneDocument(gradesCollection);
            insertManyDocuments(gradesCollection);
        }
    }

    private static void insertOneDocument(MongoCollection<Document> gradesCollection) {
        gradesCollection.insertOne(generateNewGrade(10000d, 1d));
        System.out.println("One grade inserted for studentId 10000.");
    }

    private static void insertManyDocuments(MongoCollection<Document> gradesCollection) {
        List<Document> grades = new ArrayList<>();
        for (double classId = 1d; classId <= 10d; classId++) {
            grades.add(generateNewGrade(10001d, classId));
        }

        gradesCollection.insertMany(grades, new InsertManyOptions().ordered(false));
        System.out.println("Ten grades inserted for studentId 10001.");
    }

    private static Document generateNewGrade(double studentId, double classId) {
        List<Document> scores = List.of(new Document("type", "exam").append("score", rand.nextDouble() * 100),
                                        new Document("type", "quiz").append("score", rand.nextDouble() * 100),
                                        new Document("type", "homework").append("score", rand.nextDouble() * 100),
                                        new Document("type", "homework").append("score", rand.nextDouble() * 100));
        return new Document("_id", new ObjectId()).append("student_id", studentId)
                                                  .append("class_id", classId)
                                                  .append("scores", scores);
    }
}
```

As a reminder, every write operation (create, replace, update, delete) performed on a **single** document
is [ACID](https://en.wikipedia.org/wiki/ACID) in MongoDB. Which means `insertMany` is not ACID by default but, good
news, since MongoDB 4.0, we can wrap this call in a multi-document ACID transaction to make it fully ACID. I explain
this in more detail in my blog
about [multi-document ACID transactions](https://www.mongodb.com/blog/post/java-and-mongodb-40-support-for-multidocument-acid-transactions).

## Read documents

### Create data

We created the class `Create`. Now we will work in the `Read` class.

We wrote 11 new grades, one for the student with `{"student_id": 10000}` and 10 for the student
with `{"student_id": 10001}` in the `sample_training.grades` collection.

As a reminder, here are the grades of the `{"student_id": 10000}`.

``` javascript
MongoDB Enterprise Cluster0-shard-0:PRIMARY> db.grades.findOne({"student_id":10000})
{
    "_id" : ObjectId("5daa0e274f52b44cfea94652"),
    "student_id" : 10000,
    "class_id" : 1,
    "scores" : [
        {
            "type" : "exam",
            "score" : 39.25175977753478
        },
        {
            "type" : "quiz",
            "score" : 80.2908713167313
        },
        {
            "type" : "homework",
            "score" : 63.5444978481843
        },
        {
            "type" : "homework",
            "score" : 82.35202261582563
        }
    ]
}
```

We also discussed BSON types and we noted that `student_id` and `class_id` are doubles.

MongoDB treats some types as equivalent for comparison purposes. For instance, numeric types undergo conversion before
comparison.

So, don't be surprised if I filter with an integer number and match a document which contains a double number for
example. If you want to filter documents by value types, you can use
the [$type operator](https://docs.mongodb.com/manual/reference/operator/query/type/).

You can read more
about [type bracketing](https://docs.mongodb.com/manual/reference/method/db.collection.find/#type-bracketing)
and [comparison and sort order](https://docs.mongodb.com/manual/reference/bson-type-comparison-order/) in our
documentation.

### Read a specific document

Let's read the document above. To achieve this, we will use the method `find`, passing it a filter to help identify the
document we want to find.

Please create a class `Read` in the `com.mongodb.quickstart` package with this code:

``` java
package com.mongodb.quickstart;

import com.mongodb.client.*;
import org.bson.Document;

import java.util.ArrayList;
import java.util.List;

import static com.mongodb.client.model.Filters.*;
import static com.mongodb.client.model.Projections.*;
import static com.mongodb.client.model.Sorts.descending;

public class Read {

    public static void main(String[] args) {
        try (MongoClient mongoClient = MongoClients.create(System.getProperty("mongodb.uri"))) {
            MongoDatabase sampleTrainingDB = mongoClient.getDatabase("sample_training");
            MongoCollection<Document> gradesCollection = sampleTrainingDB.getCollection("grades");

            // find one document with new Document
            Document student1 = gradesCollection.find(new Document("student_id", 10000)).first();
            System.out.println("Student 1: " + student1.toJson());
        }
    }
}
```

Also, make sure you set up your `mongodb.uri` in your system properties using your IDE if you want to run this code in
your favorite IDE.

Alternatively, you can use this Maven command line in your root project (where the `src` folder is):

``` bash
mvn compile exec:java -Dexec.mainClass="com.mongodb.quickstart.Read" -Dmongodb.uri="mongodb+srv://USERNAME:PASSWORD@cluster0-abcde.mongodb.net/test?w=majority" -Dexec.cleanupDaemonThreads=false
```

The standard output should be:

``` javascript
Student 1: {"_id": {"$oid": "5daa0e274f52b44cfea94652"},
    "student_id": 10000.0,
    "class_id": 1.0,
    "scores": [
        {"type": "exam", "score": 39.25175977753478},
        {"type": "quiz", "score": 80.2908713167313},
        {"type": "homework", "score": 63.5444978481843},
        {"type": "homework", "score": 82.35202261582563}
    ]
}
```

The MongoDB driver comes with a few helpers to ease the writing of these queries. Here's an equivalent query using
the `Filters.eq()` method.

``` java
gradesCollection.find(eq("student_id", 10000)).first();
```

Of course, I used a static import to make the code as compact and easy to read as possible.

``` java
import static com.mongodb.client.model.Filters.eq;
```

### Read a range of documents

In the previous example, the benefit of these helpers is not obvious, but let me show you another example where I'm
searching all the grades with a *student_id* greater than or equal to 10,000.

``` java
// without helpers
gradesCollection.find(new Document("student_id", new Document("$gte", 10000)));
// with the Filters.gte() helper
gradesCollection.find(gte("student_id", 10000));
```

As you can see, I'm using the `$gte` operator to write this query. You can learn about all the
different [query operators](https://docs.mongodb.com/manual/reference/operator/query/) in the MongoDB documentation.

### Iterators

The `find` method returns an object that implements the interface `FindIterable`, which ultimately extends
the `Iterable` interface so we can use an iterator to go through the list of documents we are receiving from MongoDB:

``` java
FindIterable<Document> iterable = gradesCollection.find(gte("student_id", 10000));
MongoCursor<Document> cursor = iterable.iterator();
System.out.println("Student list with cursor: ");
while (cursor.hasNext()) {
    System.out.println(cursor.next().toJson());
}
```

### Lists

Lists are usually easier to manipulate than iterators, so we can also do this to retrieve directly
an `ArrayList<Document>`:

``` java
List<Document> studentList = gradesCollection.find(gte("student_id", 10000)).into(new ArrayList<>());
System.out.println("Student list with an ArrayList:");
for (Document student : studentList) {
    System.out.println(student.toJson());
}
```

### Consumers

We could also use a `Consumer` which is a functional interface:

``` java
Consumer<Document> printConsumer = document -> System.out.println(document.toJson());
gradesCollection.find(gte("student_id", 10000)).forEach(printConsumer);
```

### Cursors, sort, skip, limit, and projections

As we saw above with the `Iterator` example, MongoDB
leverages [cursors](https://docs.mongodb.com/manual/reference/method/js-cursor/) to iterate through your result set.

If you are already familiar with the cursors in the [mongo shell](https://www.mongodb.com/docs/v4.4/mongo/), you know
that transformations can be applied to it. A cursor can
be [sorted](https://docs.mongodb.com/manual/reference/method/cursor.sort/) and the documents it contains can be
transformed using a [projection](https://docs.mongodb.com/manual/tutorial/project-fields-from-query-results/). Also,
once the cursor is sorted, we can choose to skip a few documents and limit the number of documents in the output. This
is very useful to implement pagination in your frontend for example.

Let's combine everything we have learnt in one query:

``` java
List<Document> docs = gradesCollection.find(and(eq("student_id", 10001), lte("class_id", 5)))
                                                  .projection(fields(excludeId(),
                                                                     include("class_id",
                                                                             "student_id")))
                                                  .sort(descending("class_id"))
                                                  .skip(2)
                                                  .limit(2)
                                                  .into(new ArrayList<>());

System.out.println("Student sorted, skipped, limited and projected: ");
for (Document student : docs) {
    System.out.println(student.toJson());
}
```

Here is the output we get:

``` javascript
{"student_id": 10001.0, "class_id": 3.0}
{"student_id": 10001.0, "class_id": 2.0}
```

Remember that documents are returned in
the [natural order](https://docs.mongodb.com/manual/reference/glossary/#term-natural-order), so if you want your output
ordered, you need to sort your cursors to make sure there is no randomness in your algorithm.

### Indexes

If you want to make these queries (with or without sort) efficient,
**you need** [indexes](https://docs.mongodb.com/manual/indexes/)!

To make my last query efficient, I should create this index:

``` javascript
db.grades.createIndex({"student_id": 1, "class_id": -1})
```

When I run an [explain](https://docs.mongodb.com/manual/reference/method/cursor.explain/) on this query, this is the
winning plan I get:

``` javascript
"winningPlan" : {
            "stage" : "LIMIT",
            "limitAmount" : 2,
            "inputStage" : {
                "stage" : "PROJECTION_COVERED",
                "transformBy" : {
                    "_id" : 0,
                    "class_id" : 1,
                    "student_id" : 1
                },
                "inputStage" : {
                    "stage" : "SKIP",
                    "skipAmount" : 2,
                    "inputStage" : {
                        "stage" : "IXSCAN",
                        "keyPattern" : {
                            "student_id" : 1,
                            "class_id" : -1
                        },
                        "indexName" : "student_id_1_class_id_-1",
                        "isMultiKey" : false,
                        "multiKeyPaths" : {
                            "student_id" : [ ],
                            "class_id" : [ ]
                        },
                        "isUnique" : false,
                        "isSparse" : false,
                        "isPartial" : false,
                        "indexVersion" : 2,
                        "direction" : "forward",
                        "indexBounds" : {
                            "student_id" : [
                                "[10001.0, 10001.0]"
                            ],
                            "class_id" : [
                                "[5.0, -inf.0]"
                            ]
                        }
                    }
                }
            }
        }
```

With this index, we can see that we have no *SORT* stage, so we are not doing a sort in memory as the documents are
already sorted "for free" and returned in the order of the index.

Also, we can see that we don't have any *FETCH* stage, so this is
a [covered query](https://docs.mongodb.com/manual/core/query-optimization/#covered-query), the most efficient type of
query you can run in MongoDB. Indeed, all the information we are returning at the end is already in the index, so the
index itself contains everything we need to answer this query.

### The final code to read documents

``` java
package com.mongodb.quickstart;

import com.mongodb.client.*;
import org.bson.Document;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Consumer;

import static com.mongodb.client.model.Filters.*;
import static com.mongodb.client.model.Projections.*;
import static com.mongodb.client.model.Sorts.descending;

public class Read {

    public static void main(String[] args) {
        try (MongoClient mongoClient = MongoClients.create(System.getProperty("mongodb.uri"))) {
            MongoDatabase sampleTrainingDB = mongoClient.getDatabase("sample_training");
            MongoCollection<Document> gradesCollection = sampleTrainingDB.getCollection("grades");

            // find one document with new Document
            Document student1 = gradesCollection.find(new Document("student_id", 10000)).first();
            System.out.println("Student 1: " + student1.toJson());

            // find one document with Filters.eq()
            Document student2 = gradesCollection.find(eq("student_id", 10000)).first();
            System.out.println("Student 2: " + student2.toJson());

            // find a list of documents and iterate throw it using an iterator.
            FindIterable<Document> iterable = gradesCollection.find(gte("student_id", 10000));
            MongoCursor<Document> cursor = iterable.iterator();
            System.out.println("Student list with a cursor: ");
            while (cursor.hasNext()) {
                System.out.println(cursor.next().toJson());
            }

            // find a list of documents and use a List object instead of an iterator
            List<Document> studentList = gradesCollection.find(gte("student_id", 10000)).into(new ArrayList<>());
            System.out.println("Student list with an ArrayList:");
            for (Document student : studentList) {
                System.out.println(student.toJson());
            }

            // find a list of documents and print using a consumer
            System.out.println("Student list using a Consumer:");
            Consumer<Document> printConsumer = document -> System.out.println(document.toJson());
            gradesCollection.find(gte("student_id", 10000)).forEach(printConsumer);

            // find a list of documents with sort, skip, limit and projection
            List<Document> docs = gradesCollection.find(and(eq("student_id", 10001), lte("class_id", 5)))
                                                  .projection(fields(excludeId(), include("class_id", "student_id")))
                                                  .sort(descending("class_id"))
                                                  .skip(2)
                                                  .limit(2)
                                                  .into(new ArrayList<>());

            System.out.println("Student sorted, skipped, limited and projected:");
            for (Document student : docs) {
                System.out.println(student.toJson());
            }
        }
    }
}
```

## Update documents

### Update one document

Let's edit the document with `{student_id: 10000}`. To achieve this, we will use the method `updateOne`.

Please create a class `Update` in the `com.mongodb.quickstart` package with this code:

``` java
package com.mongodb.quickstart;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.FindOneAndUpdateOptions;
import com.mongodb.client.model.ReturnDocument;
import com.mongodb.client.model.UpdateOptions;
import com.mongodb.client.result.UpdateResult;
import org.bson.Document;
import org.bson.conversions.Bson;
import org.bson.json.JsonWriterSettings;

import static com.mongodb.client.model.Filters.and;
import static com.mongodb.client.model.Filters.eq;
import static com.mongodb.client.model.Updates.*;

public class Update {

    public static void main(String[] args) {
        JsonWriterSettings prettyPrint = JsonWriterSettings.builder().indent(true).build();

        try (MongoClient mongoClient = MongoClients.create(System.getProperty("mongodb.uri"))) {
            MongoDatabase sampleTrainingDB = mongoClient.getDatabase("sample_training");
            MongoCollection<Document> gradesCollection = sampleTrainingDB.getCollection("grades");

            // update one document
            Bson filter = eq("student_id", 10000);
            Bson updateOperation = set("comment", "You should learn MongoDB!");
            UpdateResult updateResult = gradesCollection.updateOne(filter, updateOperation);
            System.out.println("=> Updating the doc with {\"student_id\":10000}. Adding comment.");
            System.out.println(gradesCollection.find(filter).first().toJson(prettyPrint));
            System.out.println(updateResult);
        }
    }
}
```

As you can see in this example, the method `updateOne` takes two parameters:

- The first one is the filter that identifies the document we want to update.
- The second one is the update operation. Here, we are setting a new field `comment` with the
  value `"You should learn MongoDB!"`.

In order to run this program, make sure you set up your `mongodb.uri` in your system properties using your IDE if you
want to run this code in your favorite IDE (see above for more details).

Alternatively, you can use this Maven command line in your root project (where the `src` folder is):

``` bash
mvn compile exec:java -Dexec.mainClass="com.mongodb.quickstart.Update" -Dmongodb.uri="mongodb+srv://USERNAME:PASSWORD@cluster0-abcde.mongodb.net/test?w=majority" -Dexec.cleanupDaemonThreads=false
```

The standard output should look like this:

``` javascript
=> Updating the doc with {"student_id":10000}. Adding comment.
{
  "_id": {
    "$oid": "5dd5c1f351f97d4a034109ed"
  },
  "student_id": 10000.0,
  "class_id": 1.0,
  "scores": [
    {
      "type": "exam",
      "score": 21.580800815091415
    },
    {
      "type": "quiz",
      "score": 87.66967927111044
    },
    {
      "type": "homework",
      "score": 96.4060480668003
    },
    {
      "type": "homework",
      "score": 75.44966835508427
    }
  ],
  "comment": "You should learn MongoDB!"
}
AcknowledgedUpdateResult{matchedCount=1, modifiedCount=1, upsertedId=null}
```

### Upsert a document

An upsert is a mix between an insert operation and an update one. It happens when you want to update a document,
assuming it exists, but it actually doesn't exist yet in your database.

In MongoDB, you can set an option to create this document on the fly and carry on with your update operation. This is an
upsert operation.

In this example, I want to add a comment to the grades of my student 10002 for the class 10 but this document doesn't
exist yet.

``` java
filter = and(eq("student_id", 10002d), eq("class_id", 10d));
updateOperation = push("comments", "You will learn a lot if you read the MongoDB blog!");
UpdateOptions options = new UpdateOptions().upsert(true);
updateResult = gradesCollection.updateOne(filter, updateOperation, options);
System.out.println("\n=> Upsert document with {\"student_id\":10002.0, \"class_id\": 10.0} because it doesn't exist yet.");
System.out.println(updateResult);
System.out.println(gradesCollection.find(filter).first().toJson(prettyPrint));
```

As you can see, I'm using the third parameter of the update operation to set the option upsert to true.

I'm also using the static method `Updates.push()` to push a new value in my array `comments` which does not exist yet,
so I'm creating an array of one element in this case.

This is the output we get:

``` javascript
=> Upsert document with {"student_id":10002.0, "class_id": 10.0} because it doesn't exist yet.
AcknowledgedUpdateResult{matchedCount=0, modifiedCount=0, upsertedId=BsonObjectId{value=5ddeb7b7224ad1d5cfab3733}}
{
  "_id": {
    "$oid": "5ddeb7b7224ad1d5cfab3733"
  },
  "class_id": 10.0,
  "student_id": 10002.0,
  "comments": [
    "You will learn a lot if you read the MongoDB blog!"
  ]
}
```

### Update many documents

The same way I was able to update one document with `updateOne()`, I can update multiple documents with `updateMany()`.

``` java
filter = eq("student_id", 10001);
updateResult = gradesCollection.updateMany(filter, updateOperation);
System.out.println("\n=> Updating all the documents with {\"student_id\":10001}.");
System.out.println(updateResult);
```

In this example, I'm using the same `updateOperation` as earlier, so I'm creating a new one element array `comments` in
these 10 documents.

Here is the output:

``` javascript
=> Updating all the documents with {"student_id":10001}.
AcknowledgedUpdateResult{matchedCount=10, modifiedCount=10, upsertedId=null}
```

### The findOneAndUpdate method

Finally, we have one last very useful method available in the MongoDB Java Driver: `findOneAndUpdate()`.

In most web applications, when a user updates something, they want to see this update reflected on their web page.
Without the `findOneAndUpdate()` method, you would have to run an update operation and then fetch the document with a
find operation to make sure you are printing the latest version of this object in the web page.

The `findOneAndUpdate()` method allows you to combine these two operations in one.

``` java
// findOneAndUpdate
filter = eq("student_id", 10000);
Bson update1 = inc("x", 10); // increment x by 10. As x doesn't exist yet, x=10.
Bson update2 = rename("class_id", "new_class_id"); // rename variable "class_id" in "new_class_id".
Bson update3 = mul("scores.0.score", 2); // multiply the first score in the array by 2.
Bson update4 = addToSet("comments", "This comment is uniq"); // creating an array with a comment.
Bson update5 = addToSet("comments", "This comment is uniq"); // using addToSet so no effect.
Bson updates = combine(update1, update2, update3, update4, update5);
// returns the old version of the document before the update.
Document oldVersion = gradesCollection.findOneAndUpdate(filter, updates);
System.out.println("\n=> FindOneAndUpdate operation. Printing the old version by default:");
System.out.println(oldVersion.toJson(prettyPrint));

// but I can also request the new version
filter = eq("student_id", 10001);
FindOneAndUpdateOptions optionAfter = new FindOneAndUpdateOptions().returnDocument(ReturnDocument.AFTER);
Document newVersion = gradesCollection.findOneAndUpdate(filter, updates, optionAfter);
System.out.println("\n=> FindOneAndUpdate operation. But we can also ask for the new version of the doc:");
System.out.println(newVersion.toJson(prettyPrint));
```

Here is the output:

``` javascript
=> FindOneAndUpdate operation. Printing the old version by default:
{
  "_id": {
    "$oid": "5dd5d46544fdc35505a8271b"
  },
  "student_id": 10000.0,
  "class_id": 1.0,
  "scores": [
    {
      "type": "exam",
      "score": 69.52994626959251
    },
    {
      "type": "quiz",
      "score": 87.27457417188077
    },
    {
      "type": "homework",
      "score": 83.40970667948744
    },
    {
      "type": "homework",
      "score": 40.43663797673247
    }
  ],
  "comment": "You should learn MongoDB!"
}

=> FindOneAndUpdate operation. But we can also ask for the new version of the doc:
{
  "_id": {
    "$oid": "5dd5d46544fdc35505a82725"
  },
  "student_id": 10001.0,
  "scores": [
    {
      "type": "exam",
      "score": 138.42535412437857
    },
    {
      "type": "quiz",
      "score": 84.66740178906916
    },
    {
      "type": "homework",
      "score": 36.773091359279675
    },
    {
      "type": "homework",
      "score": 14.90842128691825
    }
  ],
  "comments": [
    "You will learn a lot if you read the MongoDB blog!",
    "This comment is uniq"
  ],
  "new_class_id": 10.0,
  "x": 10
}
```

As you can see in this example, you can choose which version of the document you want to return using the appropriate
option.

I also used this example to show you a bunch of update operators:

- `set` will set a value.
- `inc` will increment a value.
- `rename` will rename a field.
- `mul` will multiply the value by the given number.
- `addToSet` is similar to push but will only push the value in the array if the value doesn't exist already.

There are a few other update operators. You can consult the entire list in
our [documentation](https://docs.mongodb.com/manual/reference/operator/update/).

### The final code for updates

``` java
package com.mongodb.quickstart;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.FindOneAndUpdateOptions;
import com.mongodb.client.model.ReturnDocument;
import com.mongodb.client.model.UpdateOptions;
import com.mongodb.client.result.UpdateResult;
import org.bson.Document;
import org.bson.conversions.Bson;
import org.bson.json.JsonWriterSettings;

import static com.mongodb.client.model.Filters.and;
import static com.mongodb.client.model.Filters.eq;
import static com.mongodb.client.model.Updates.*;

public class Update {

    public static void main(String[] args) {
        JsonWriterSettings prettyPrint = JsonWriterSettings.builder().indent(true).build();

        try (MongoClient mongoClient = MongoClients.create(System.getProperty("mongodb.uri"))) {
            MongoDatabase sampleTrainingDB = mongoClient.getDatabase("sample_training");
            MongoCollection<Document> gradesCollection = sampleTrainingDB.getCollection("grades");

            // update one document
            Bson filter = eq("student_id", 10000);
            Bson updateOperation = set("comment", "You should learn MongoDB!");
            UpdateResult updateResult = gradesCollection.updateOne(filter, updateOperation);
            System.out.println("=> Updating the doc with {\"student_id\":10000}. Adding comment.");
            System.out.println(gradesCollection.find(filter).first().toJson(prettyPrint));
            System.out.println(updateResult);

            // upsert
            filter = and(eq("student_id", 10002d), eq("class_id", 10d));
            updateOperation = push("comments", "You will learn a lot if you read the MongoDB blog!");
            UpdateOptions options = new UpdateOptions().upsert(true);
            updateResult = gradesCollection.updateOne(filter, updateOperation, options);
            System.out.println("\n=> Upsert document with {\"student_id\":10002.0, \"class_id\": 10.0} because it doesn't exist yet.");
            System.out.println(updateResult);
            System.out.println(gradesCollection.find(filter).first().toJson(prettyPrint));

            // update many documents
            filter = eq("student_id", 10001);
            updateResult = gradesCollection.updateMany(filter, updateOperation);
            System.out.println("\n=> Updating all the documents with {\"student_id\":10001}.");
            System.out.println(updateResult);

            // findOneAndUpdate
            filter = eq("student_id", 10000);
            Bson update1 = inc("x", 10); // increment x by 10. As x doesn't exist yet, x=10.
            Bson update2 = rename("class_id", "new_class_id"); // rename variable "class_id" in "new_class_id".
            Bson update3 = mul("scores.0.score", 2); // multiply the first score in the array by 2.
            Bson update4 = addToSet("comments", "This comment is uniq"); // creating an array with a comment.
            Bson update5 = addToSet("comments", "This comment is uniq"); // using addToSet so no effect.
            Bson updates = combine(update1, update2, update3, update4, update5);
            // returns the old version of the document before the update.
            Document oldVersion = gradesCollection.findOneAndUpdate(filter, updates);
            System.out.println("\n=> FindOneAndUpdate operation. Printing the old version by default:");
            System.out.println(oldVersion.toJson(prettyPrint));

            // but I can also request the new version
            filter = eq("student_id", 10001);
            FindOneAndUpdateOptions optionAfter = new FindOneAndUpdateOptions().returnDocument(ReturnDocument.AFTER);
            Document newVersion = gradesCollection.findOneAndUpdate(filter, updates, optionAfter);
            System.out.println("\n=> FindOneAndUpdate operation. But we can also ask for the new version of the doc:");
            System.out.println(newVersion.toJson(prettyPrint));
        }
    }
}
```

## Delete documents

### Delete one document

Let's delete the document above. To achieve this, we will use the method `deleteOne`.

Please create a class `Delete` in the `com.mongodb.quickstart` package with this code:

``` java
package com.mongodb.quickstart;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.result.DeleteResult;
import org.bson.Document;
import org.bson.conversions.Bson;

import static com.mongodb.client.model.Filters.eq;
import static com.mongodb.client.model.Filters.gte;

public class Delete {

    public static void main(String[] args) {

        try (MongoClient mongoClient = MongoClients.create(System.getProperty("mongodb.uri"))) {
            MongoDatabase sampleTrainingDB = mongoClient.getDatabase("sample_training");
            MongoCollection<Document> gradesCollection = sampleTrainingDB.getCollection("grades");

            // delete one document
            Bson filter = eq("student_id", 10000);
            DeleteResult result = gradesCollection.deleteOne(filter);
            System.out.println(result);
        }
    }
}
```

As you can see in this example, the method `deleteOne` only takes one parameter: a filter, just like the `find()`
operation.

In order to run this program, make sure you set up your `mongodb.uri` in your system properties using your IDE if you
want to run this code in your favorite IDE (see above for more details).

Alternatively, you can use this Maven command line in your root project (where the `src` folder is):

``` bash
mvn compile exec:java -Dexec.mainClass="com.mongodb.quickstart.Delete" -Dmongodb.uri="mongodb+srv://USERNAME:PASSWORD@cluster0-abcde.mongodb.net/test?w=majority" -Dexec.cleanupDaemonThreads=false
```

The standard output should look like this:

``` javascript
AcknowledgedDeleteResult{deletedCount=1}
```

### FindOneAndDelete()

Are you emotionally attached to your document and want a chance to see it one last time before it's too late? We have
what you need.

The method `findOneAndDelete()` allows you to retrieve a document and delete it in a single atomic operation.

Here is how it works:

``` java
Bson filter = eq("student_id", 10002);
Document doc = gradesCollection.findOneAndDelete(filter);
System.out.println(doc.toJson(JsonWriterSettings.builder().indent(true).build()));
```

Here is the output we get:

``` javascript
{
  "_id": {
    "$oid": "5ddec378224ad1d5cfac02b8"
  },
  "class_id": 10.0,
  "student_id": 10002.0,
  "comments": [
    "You will learn a lot if you read the MongoDB blog!"
  ]
}
```

### Delete many documents

This time we will use `deleteMany()` instead of `deleteOne()` and we will use a different filter to match more
documents.

``` java
Bson filter = gte("student_id", 10000);
DeleteResult result = gradesCollection.deleteMany(filter);
System.out.println(result);
```

As a reminder, you can learn more about all the query selectors [in our
documentation](https://docs.mongodb.com/manual/reference/operator/query/#query-selectors).

This is the output we get:

``` javascript
AcknowledgedDeleteResult{deletedCount=10}
```

### Delete a collection

Deleting all the documents from a collection will not delete the collection itself because a collection also contains
metadata like the index definitions or the chunk distribution if your collection is sharded for example.

If you want to remove the entire collection **and** all the metadata associated with it, then you need to use
the `drop()` method.

``` java
gradesCollection.drop();
```

### The final code for delete operations

``` java
package com.mongodb.quickstart;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.result.DeleteResult;
import org.bson.Document;
import org.bson.conversions.Bson;
import org.bson.json.JsonWriterSettings;

import static com.mongodb.client.model.Filters.eq;
import static com.mongodb.client.model.Filters.gte;

public class Delete {

    public static void main(String[] args) {
        try (MongoClient mongoClient = MongoClients.create(System.getProperty("mongodb.uri"))) {
            MongoDatabase sampleTrainingDB = mongoClient.getDatabase("sample_training");
            MongoCollection<Document> gradesCollection = sampleTrainingDB.getCollection("grades");

            // delete one document
            Bson filter = eq("student_id", 10000);
            DeleteResult result = gradesCollection.deleteOne(filter);
            System.out.println(result);

            // findOneAndDelete operation
            filter = eq("student_id", 10002);
            Document doc = gradesCollection.findOneAndDelete(filter);
            System.out.println(doc.toJson(JsonWriterSettings.builder().indent(true).build()));

            // delete many documents
            filter = gte("student_id", 10000);
            result = gradesCollection.deleteMany(filter);
            System.out.println(result);

            // delete the entire collection and its metadata (indexes, chunk metadata, etc).
            gradesCollection.drop();
        }
    }
}
```

## Wrapping up

With this blog post, we have covered all the basic operations, such as create and read, and have also seen how we can
easily use powerful functions available in the Java driver for MongoDB. You can find the links to the other blog posts
of this series just below.

> If you want to learn more and deepen your knowledge faster, I recommend you check out the "MongoDB Java
> Developer Path" available for free on [MongoDB University](https://learn.mongodb.com/learning-paths/mongodb-java-developer-path).
