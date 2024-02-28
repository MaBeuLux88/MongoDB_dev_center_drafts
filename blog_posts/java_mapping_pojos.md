## Updates

The MongoDB Java quickstart repository is [available on GitHub](https://github.com/mongodb-developer/java-quick-start).

### February 28th, 2024

- Update to Java 21
- Update Java Driver to 5.0.0
- Update `logback-classic` to 1.2.13

### November 14th, 2023

- Update to Java 17
- Update Java Driver to 4.11.1
- Update mongodb-crypt to 1.8.0

### March 25th, 2021

-   Update Java Driver to 4.2.2.
-   Added Client Side Field Level Encryption example.

### October 21st, 2020

-   Update Java Driver to 4.1.1.
-   The Java Driver logging is now enabled via the popular [SLF4J](http://www.slf4j.org/) API, so I added logback in the `pom.xml` and a configuration file `logback.xml`.

## Introduction

<div>
<img 
        style="float: right;
        border-radius: 10px;
        margin-bottom: 30px;
        vertical-align: bottom;
        width: 30%;"
        src="https://mongodb-devhub-cms.s3.us-west-1.amazonaws.com/old_images/qs-badges/qs-badge-java.png" class="align-right" alt="Java badge" />

Java is an object-oriented programming language and MongoDB stores documents, which look a lot like objects. Indeed, this is not a coincidence because that's the core idea behind the MongoDB database.
</div>

In this blog post, as promised in the [first blog post](/quickstart/java-setup-crud-operations/) of this series, I will show you how to automatically map MongoDB documents to Plain Old Java Objects (POJOs) using only the MongoDB driver.

## Getting Set Up

I will use the same repository as usual in this series. If you don't have a copy of it yet, you can clone it or just update it if you already have it:

``` sh
git clone https://github.com/mongodb-developer/java-quick-start
```

If you haven't yet set up your free cluster on MongoDB Atlas, now is a great time to do so. You have all the instructions in this [blog post](/quickstart/free-atlas-cluster/).

## The Grades Collection

If you followed this series, you know that we have been working with the `grades` collection in the `sample_training` database. You can import it easily by [loading the sample dataset in MongoDB Atlas](https://docs.atlas.mongodb.com/sample-data/load-sample-data/).

Here is what a MongoDB document looks like in extended JSON format. I'm using the extended JSON because it's easier to identify the field types and we will need them to build the POJOs.

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

## POJOs

The first thing we need is a representation of this document in Java.  For each document or subdocument, I need a corresponding POJO class.

As you can see in the document above, I have the main document itself and I have an array of subdocuments in the `scores` field. Thus, we will need 2 POJOs to represent this document in Java:

-   One for the grade,
-   One for the scores.

In the package `com.mongodb.quickstart.models`, I created two new POJOs: `Grade.java` and `Score.java`.

[Grade.java](https://github.com/mongodb-developer/java-quick-start/blob/master/src/main/java/com/mongodb/quickstart/models/Grade.java):

``` java
package com.mongodb.quickstart.models;

// imports

public class Grade {

    private ObjectId id;
    @BsonProperty(value = "student_id")
    private Double studentId;
    @BsonProperty(value = "class_id")
    private Double classId;
    private List<Score> scores;

    // getters and setters with builder pattern
    // toString()
    // equals()
    // hashCode()
}
```

>In the Grade class above, I'm using `@BsonProperty` to avoid violating Java naming conventions for variables, getters, and setters. This allows me to indicate to the mapper that I want the `"student_id"` field in JSON to be mapped to the `"studentId"` field in Java.

[Score.java](https://github.com/mongodb-developer/java-quick-start/blob/master/src/main/java/com/mongodb/quickstart/models/Score.java):

``` java
package com.mongodb.quickstart.models;

import java.util.Objects;

public class Score {

    private String type;
    private Double score;

    // getters and setters with builder pattern
    // toString()
    // equals()
    // hashCode()
}
```

As you can see, we took care of matching the Java types with the JSON value types to follow the same data model. You can read more about [types and documents in the documentation](https://mongodb.github.io/mongo-java-driver/3.12/bson/documents/).

## Mapping POJOs

Now that we have everything we need, we can start the MongoDB driver code.

I created a new class `MappingPOJO` in the `com.mongodb.quickstart` package and here are the key lines of code:

-   I need a `ConnectionString` instance instead of the usual `String` I have used so far in this series. I'm still retrieving my MongoDB Atlas URI from the system properties. See my [starting and setup blog post](/quickstart/java-setup-crud-operations/) if you need a reminder.

``` java
ConnectionString connectionString = new ConnectionString(System.getProperty("mongodb.uri"));
```

-   I need to configure the CodecRegistry to include a codec to handle the translation to and from BSON for our POJOs.

``` java
CodecRegistry pojoCodecRegistry = fromProviders(PojoCodecProvider.builder().automatic(true).build());
```

-   And I need to add the default codec registry, which contains all the default codecs. They can handle all the major types in Java-like `Boolean`, `Double`, `String`, `BigDecimal`, etc.

``` java
CodecRegistry codecRegistry = fromRegistries(MongoClientSettings.getDefaultCodecRegistry(),
                                             pojoCodecRegistry);
```

-   I can now wrap all my settings together using `MongoClientSettings`.

``` java
MongoClientSettings clientSettings = MongoClientSettings.builder()
                                                        .applyConnectionString(connectionString)
                                                        .codecRegistry(codecRegistry)
                                                        .build();
```

-   I can finally initialise my connection with MongoDB.

``` java
try (MongoClient mongoClient = MongoClients.create(clientSettings)) {
    MongoDatabase db = mongoClient.getDatabase("sample_training");
    MongoCollection<Grade> grades = db.getCollection("grades", Grade.class);
    [...]
}
```

As you can see in this last line of Java, all the magic is happening here. The `MongoCollection<Grade>` I'm retrieving is typed by `Grade` and not by `Document` as usual.

In the previous blog posts in this series, I showed you how to use CRUD operations by manipulating `MongoCollection<Document>`. Let's review all the CRUD operations using POJOs now.

-   Here is an insert (create).

``` java
Grade newGrade = new Grade().setStudent_id(10003d)
                            .setClass_id(10d)
                            .setScores(List.of(new Score().setType("homework").setScore(50d)));
grades.insertOne(newGrade);
```

-   Here is a find (read).

``` java
Grade grade = grades.find(eq("student_id", 10003d)).first();
System.out.println("Grade found:\t" + grade);
```

-   Here is an update with a `findOneAndReplace` returning the newest version of the document.

``` java
List<Score> newScores = new ArrayList<>(grade.getScores());
newScores.add(new Score().setType("exam").setScore(42d));
grade.setScores(newScores);
Document filterByGradeId = new Document("_id", grade.getId());
FindOneAndReplaceOptions returnDocAfterReplace = new FindOneAndReplaceOptions()
                                                     .returnDocument(ReturnDocument.AFTER);
Grade updatedGrade = grades.findOneAndReplace(filterByGradeId, grade, returnDocAfterReplace);
System.out.println("Grade replaced:\t" + updatedGrade);
```

-   And finally here is a `deleteOne`.

``` java
System.out.println(grades.deleteOne(filterByGradeId));
```

## Final Code

`MappingPojo.java` ([code](https://github.com/mongodb-developer/java-quick-start/blob/master/src/main/java/com/mongodb/quickstart/MappingPOJO.java)):

``` java
package com.mongodb.quickstart;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.FindOneAndReplaceOptions;
import com.mongodb.client.model.ReturnDocument;
import com.mongodb.quickstart.models.Grade;
import com.mongodb.quickstart.models.Score;
import org.bson.codecs.configuration.CodecRegistry;
import org.bson.codecs.pojo.PojoCodecProvider;
import org.bson.conversions.Bson;

import java.util.ArrayList;
import java.util.List;

import static com.mongodb.client.model.Filters.eq;
import static org.bson.codecs.configuration.CodecRegistries.fromProviders;
import static org.bson.codecs.configuration.CodecRegistries.fromRegistries;

public class MappingPOJO {

    public static void main(String[] args) {
        ConnectionString connectionString = new ConnectionString(System.getProperty("mongodb.uri"));
        CodecRegistry pojoCodecRegistry = fromProviders(PojoCodecProvider.builder().automatic(true).build());
        CodecRegistry codecRegistry = fromRegistries(MongoClientSettings.getDefaultCodecRegistry(), pojoCodecRegistry);
        MongoClientSettings clientSettings = MongoClientSettings.builder()
                                                                .applyConnectionString(connectionString)
                                                                .codecRegistry(codecRegistry)
                                                                .build();
        try (MongoClient mongoClient = MongoClients.create(clientSettings)) {
            MongoDatabase db = mongoClient.getDatabase("sample_training");
            MongoCollection<Grade> grades = db.getCollection("grades", Grade.class);

            // create a new grade.
            Grade newGrade = new Grade().setStudentId(10003d)
                                        .setClassId(10d)
                                        .setScores(List.of(new Score().setType("homework").setScore(50d)));
            grades.insertOne(newGrade);
            System.out.println("Grade inserted.");

            // find this grade.
            Grade grade = grades.find(eq("student_id", 10003d)).first();
            System.out.println("Grade found:\t" + grade);

            // update this grade: adding an exam grade
            List<Score> newScores = new ArrayList<>(grade.getScores());
            newScores.add(new Score().setType("exam").setScore(42d));
            grade.setScores(newScores);
            Bson filterByGradeId = eq("_id", grade.getId());
            FindOneAndReplaceOptions returnDocAfterReplace = new FindOneAndReplaceOptions().returnDocument(ReturnDocument.AFTER);
            Grade updatedGrade = grades.findOneAndReplace(filterByGradeId, grade, returnDocAfterReplace);
            System.out.println("Grade replaced:\t" + updatedGrade);

            // delete this grade
            System.out.println("Grade deleted:\t" + grades.deleteOne(filterByGradeId));
        }
    }
}
```

To start this program, you can use this maven command line in your root project (where the `src` folder is) or your favorite IDE.

``` bash
mvn compile exec:java -Dexec.mainClass="com.mongodb.quickstart.MappingPOJO" -Dmongodb.uri="mongodb+srv://USERNAME:PASSWORD@cluster0-abcde.mongodb.net/test?w=majority"
```

## Wrapping Up

Mapping POJOs and your MongoDB documents simplifies your life a lot when you are solving real-world problems with Java, but you can certainly be successful without using POJOs.

MongoDB is a dynamic schema database which means your documents can have different schemas within a single collection. Mapping all the documents from such a collection can be a challenge. So, sometimes, using the "old school" method and the `Document` class will be easier.

>If you want to learn more and deepen your knowledge faster, I recommend you check out the [MongoDB Java Developer Path](https://learn.mongodb.com/learning-paths/mongodb-java-developer-path) training available for free on [MongoDB University](https://learn.mongodb.com/).

In the next blog post, I will show you the aggregation framework in Java.
