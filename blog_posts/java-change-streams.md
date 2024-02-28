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
        src="https://mongodb-devhub-cms.s3.us-west-1.amazonaws.com/old_images/qs-badges/qs-badge-java.png" alt="Java badge" />

Change Streams were introduced in MongoDB 3.6. They allow applications to access real-time data changes without the complexity and risk of tailing the [oplog](https://docs.mongodb.com/manual/reference/glossary/#term-oplog).
</div>

Applications can use change streams to subscribe to all data changes on a single collection, a database, or an entire deployment, and immediately react to them. Because change streams use the aggregation framework, an application can also filter for specific changes or transform the notifications at will.

In this blog post, as promised in the [first blog post](/quickstart/java-setup-crud-operations/) of this series, I will show you how to leverage MongoDB Change Streams using Java.

## Getting Set Up

I will use the same repository as usual in this series. If you don't have a copy of it yet, you can clone it or just update it if you already have it:

``` sh
git clone https://github.com/mongodb-developer/java-quick-start
```

>If you haven't yet set up your free cluster on MongoDB Atlas, now is a great time to do so. You have all the instructions in this [blog post](/quickstart/free-atlas-cluster/).

## Change Streams

In this blog post, I will be working on the file called `ChangeStreams.java`, but Change Streams are **super** easy to work with.

I will show you 5 different examples to showcase some features of the Change Streams. For the sake of simplicity, I will only show you the pieces of code related to the Change Streams directly. You can find the entire code sample at the bottom of this blog post or in the [Github repository](https://github.com/mongodb-developer/java-quick-start).

For each example, you will need to start 2 Java programs in the correct order if you want to reproduce my examples.

-   The first program is always the one that contains the Change Streams code.
-   The second one will be one of the Java programs we already used in this Java blog posts series. You can find them in the Github repository. They will generate MongoDB operations that we will observe in the Change Streams output.

### A simple Change Streams without filters

Let's start with the most simple Change Stream we can make:

``` java
MongoCollection<Grade> grades = db.getCollection("grades", Grade.class);
ChangeStreamIterable<Grade> changeStream = grades.watch();
changeStream.forEach((Consumer<ChangeStreamDocument<Grade>>) System.out::println);
```

As you can see, all we need is `myCollection.watch()`! That's it.

This returns a `ChangeStreamIterable` which, as indicated by its name, can be iterated to return our change events. Here, I'm iterating over my Change Stream to print my change event documents in the Java standard output.

I can also simplify this code like this:

``` java
grades.watch().forEach(printEvent());

private static Consumer<ChangeStreamDocument<Grade>> printEvent() {
    return System.out::println;
}
```

I will reuse this functional interface in my following examples to ease the reading.

To run this example:

-   Uncomment only the example 1 from the `ChangeStreams.java` file and start it in your IDE or a dedicated console using Maven in the root of your project.

``` bash
mvn compile exec:java -Dexec.mainClass="com.mongodb.quickstart.ChangeStreams" -Dmongodb.uri="mongodb+srv://USERNAME:PASSWORD@cluster0-abcde.mongodb.net/test?w=majority"
```

-   Start `MappingPOJO.java` in another console or in your IDE.

``` bash
mvn compile exec:java -Dexec.mainClass="com.mongodb.quickstart.MappingPOJO" -Dmongodb.uri="mongodb+srv://USERNAME:PASSWORD@cluster0-abcde.mongodb.net/test?w=majority"
```

In MappingPOJO, we are doing 4 MongoDB operations:

-   I'm creating a new `Grade` document with the `insertOne()` method,
-   I'm searching for this `Grade` document using the `find()` method,
-   I'm replacing entirely this `Grade` using the `findOneAndReplace()` method,
-   and finally, I'm deleting this `Grade` using the `deleteOne()` method.

This is confirmed in the standard output from `MappingJava`:

``` javascript
Grade inserted.
Grade found:    Grade{id=5e2b4a28c9e9d55e3d7dbacf, student_id=10003.0, class_id=10.0, scores=[Score{type='homework', score=50.0}]}
Grade replaced: Grade{id=5e2b4a28c9e9d55e3d7dbacf, student_id=10003.0, class_id=10.0, scores=[Score{type='homework', score=50.0}, Score{type='exam', score=42.0}]}
Grade deleted:  AcknowledgedDeleteResult{deletedCount=1}
```

Let's check what we have in the standard output from `ChangeStreams.java` (prettified):

``` javascript
ChangeStreamDocument{
   operationType=OperationType{ value='insert' },
   resumeToken={ "_data":"825E2F3E40000000012B022C0100296E5A100496C525567BB74BD28BFD504F987082C046645F696400645E2F3E400C47CF19D59361620004" },
   namespace=sample_training.grades,
   destinationNamespace=null,
   fullDocument=Grade{
      id=5e2f3e400c47cf19d5936162,
      student_id=10003.0,
      class_id=10.0,
      scores=[ Score { type='homework', score=50.0 } ]
   },
   documentKey={ "_id":{ "$oid":"5e2f3e400c47cf19d5936162" } },
   clusterTime=Timestamp{
      value=6786711608069455873,
      seconds=1580154432,
      inc=1
   },
   updateDescription=null,
   txnNumber=null,
   lsid=null
}
ChangeStreamDocument{ operationType=OperationType{ value= 'replace' },
   resumeToken={ "_data":"825E2F3E40000000032B022C0100296E5A100496C525567BB74BD28BFD504F987082C046645F696400645E2F3E400C47CF19D59361620004" },
   namespace=sample_training.grades,
   destinationNamespace=null,
   fullDocument=Grade{
      id=5e2f3e400c47cf19d5936162,
      student_id=10003.0,
      class_id=10.0,
      scores=[ Score{ type='homework', score=50.0 }, Score{ type='exam', score=42.0 } ]
   },
   documentKey={ "_id":{ "$oid":"5e2f3e400c47cf19d5936162" } },
   clusterTime=Timestamp{
      value=6786711608069455875,
      seconds=1580154432,
      inc=3
   },
   updateDescription=null,
   txnNumber=null,
   lsid=null
}
ChangeStreamDocument{
   operationType=OperationType{ value='delete' },
   resumeToken={ "_data":"825E2F3E40000000042B022C0100296E5A100496C525567BB74BD28BFD504F987082C046645F696400645E2F3E400C47CF19D59361620004" },
   namespace=sample_training.grades,
   destinationNamespace=null,
   fullDocument=null,
   documentKey={ "_id":{ "$oid":"5e2f3e400c47cf19d5936162" } },
   clusterTime=Timestamp{
      value=6786711608069455876,
      seconds=1580154432,
      inc=4
   },
   updateDescription=null,
   txnNumber=null,
   lsid=null
}
```

As you can see, only 3 operations appear in the Change Stream:

- insert,
- replace,
- delete.

It was expected because the `find()` operation is just a reading document from MongoDB. It's not changing anything thus not generating an event in the Change Stream.

Now that we are done with the basic example, let's explore some features of the Change Streams.

Terminate the Change Stream program we started earlier and let's move on.

### A simple Change Stream filtering on the operation type

Now let's do the same thing but let's imagine that we are only interested in insert and delete operations.

``` java
List<Bson> pipeline = List.of(match(in("operationType", List.of("insert", "delete"))));
grades.watch(pipeline).forEach(printEvent());
```

As you can see here, I'm using the aggregation pipeline feature of Change Streams to filter down the change events I want to process.

Uncomment the example 2 in `ChangeStreams.java` and execute the program followed by `MappingPOJO.java`, just like we did earlier.

Here are the change events I'm receiving.

``` json
ChangeStreamDocument {operationType=OperationType {value= 'insert'},
  resumeToken= {"_data": "825E2F4983000000012B022C0100296E5A100496C525567BB74BD28BFD504F987082C046645F696400645E2F4983CC1D2842BFF555640004"},
  namespace=sample_training.grades,
  destinationNamespace=null,
  fullDocument=Grade
  {
    id=5e2f4983cc1d2842bff55564,
    student_id=10003.0,
    class_id=10.0,
    scores= [ Score {type= 'homework', score=50.0}]
  },
  documentKey= {"_id": {"$oid": "5e2f4983cc1d2842bff55564" }},
  clusterTime=Timestamp {value=6786723990460170241, seconds=1580157315, inc=1 },
  updateDescription=null,
  txnNumber=null,
  lsid=null
}

ChangeStreamDocument { operationType=OperationType {value= 'delete'},
  resumeToken= {"_data": "825E2F4983000000042B022C0100296E5A100496C525567BB74BD28BFD504F987082C046645F696400645E2F4983CC1D2842BFF555640004"},
  namespace=sample_training.grades,
  destinationNamespace=null,
  fullDocument=null,
  documentKey= {"_id": {"$oid": "5e2f4983cc1d2842bff55564"}},
  clusterTime=Timestamp {value=6786723990460170244, seconds=1580157315, inc=4},
  updateDescription=null,
  txnNumber=null,
  lsid=null
  }
]
```

This time, I'm only getting 2 events `insert` and `delete`. The `replace` event has been filtered out compared to the first example.

### Change Stream default behavior with update operations

Same as earlier, I'm filtering my change stream to keep only the update operations this time.

``` java
List<Bson> pipeline = List.of(match(eq("operationType", "update")));
grades.watch(pipeline).forEach(printEvent());
```

This time, follow these steps.

-   uncomment the example 3 in `ChangeStreams.java`,
-   if you never ran `Create.java`, run it. We are going to use these new documents in the next step.
-   start `Update.java` in another console.

In your change stream console, you should see 13 update events. Here is the first one:

``` json
ChangeStreamDocument {operationType=OperationType {value= 'update'},
  resumeToken= {"_data": "825E2FB83E000000012B022C0100296E5A100496C525567BB74BD28BFD504F987082C046645F696400645E27BCCE74AA51A0486763FE0004"},
  namespace=sample_training.grades,
  destinationNamespace=null,
  fullDocument=null,
  documentKey= {"_id": {"$oid": "5e27bcce74aa51a0486763fe"}},
  clusterTime=Timestamp {value=6786845739898109953, seconds=1580185662, inc=1},
  updateDescription=UpdateDescription {removedFields= [], updatedFields= {"comments.10": "You will learn a lot if you read the MongoDB blog!"}},
  txnNumber=null,
  lsid=null
}
```

As you can see, we are retrieving our update operation in the `updateDescription` field, but we are only getting the difference with the previous version of this document.

The `fullDocument` field is `null` because, by default, MongoDB only sends the difference to avoid overloading the change stream with potentially useless information.

Let's see how we can change this behavior in the next example.

### Change Stream with "Update Lookup"

For this part, uncomment the example 4 from `ChangeStreams.java` and execute the programs as above.

``` java
List<Bson> pipeline = List.of(match(eq("operationType", "update")));
grades.watch(pipeline).fullDocument(UPDATE_LOOKUP).forEach(printEvent());
```

I added the option `UPDATE_LOOKUP` this time, so we can also retrieve the entire document during an update operation.

Let's see again the first update in my change stream:

``` json
ChangeStreamDocument {operationType=OperationType {value= 'update'},
  resumeToken= {"_data": "825E2FBBC1000000012B022C0100296E5A100496C525567BB74BD28BFD504F987082C046645F696400645E27BCCE74AA51A0486763FE0004"},
  namespace=sample_training.grades,
  destinationNamespace=null,
  fullDocument=Grade
    {
      id=5e27bcce74aa51a0486763fe,
      student_id=10002.0,
      class_id=10.0,
      scores=null
    },
  documentKey= {"_id": {"$oid": "5e27bcce74aa51a0486763fe" }},
  clusterTime=Timestamp {value=6786849601073709057, seconds=1580186561, inc=1 },
  updateDescription=UpdateDescription {removedFields= [], updatedFields= {"comments.11": "You will learn a lot if you read the MongoDB blog!"}},
  txnNumber=null,
  lsid=null
}
```

>Note: The `Update.java` program updates a made-up field "comments" that doesn't exist in my POJO `Grade` which represents the original schema for this collection. Thus, the field doesn't appear in the output as it's not mapped.

If I want to see this `comments` field, I can use a `MongoCollection` not mapped automatically to my `Grade.java` POJO.

``` java
MongoCollection<Document> grades = db.getCollection("grades");
List<Bson> pipeline = List.of(match(eq("operationType", "update")));
grades.watch(pipeline).fullDocument(UPDATE_LOOKUP).forEach((Consumer<ChangeStreamDocument<Document>>) System.out::println);
```

Then this is what I get in my change stream:

``` json
ChangeStreamDocument {operationType=OperationType {value= 'update'},
  resumeToken= {"_data": "825E2FBD89000000012B022C0100296E5A100496C525567BB74BD28BFD504F987082C046645F696400645E27BCCE74AA51A0486763FE0004"},
  namespace=sample_training.grades,
  destinationNamespace=null,
  fullDocument=Document {
    {
      _id=5e27bcce74aa51a0486763fe,
      class_id=10.0,
      student_id=10002.0,
      comments= [ You will learn a lot if you read the MongoDB blog!, [...], You will learn a lot if you read the MongoDB blog!]
    }
  },
  documentKey= {"_id": {"$oid": "5e27bcce74aa51a0486763fe"}},
  clusterTime=Timestamp {value=6786851559578796033, seconds=1580187017, inc=1},
  updateDescription=UpdateDescription {removedFields= [], updatedFields= {"comments.13": "You will learn a lot if you read the MongoDB blog!"}},
  txnNumber=null,
  lsid=null
}
```

I have shortened the `comments` field to keep it readable but it contains 14 times the same comment in my case.

The full document we are retrieving here during our update operation is the document **after** the update has occurred. Read more about this in [our documentation](https://docs.mongodb.com/manual/changeStreams/#lookup-full-document-for-update-operations).

### Change Streams are resumable

In this final example 5, I have simulated an error and I'm restarting my Change Stream from a `resumeToken` I got from a previous operation in my Change Stream.

>It's important to note that a change stream will resume itself automatically in the face of an "incident". Generally, the only reason that an application needs to restart the change stream manually from a resume token is if there is an incident in the application itself rather than the change stream (e.g. an operator has decided that the application needs to be restarted).

``` java
private static void exampleWithResumeToken(MongoCollection<Grade> grades) {
    List<Bson> pipeline = List.of(match(eq("operationType", "update")));
    ChangeStreamIterable<Grade> changeStream = grades.watch(pipeline);
    MongoChangeStreamCursor<ChangeStreamDocument<Grade>> cursor = changeStream.cursor();
    System.out.println("==> Going through the stream a first time & record a resumeToken");
    int indexOfOperationToRestartFrom = 5;
    int indexOfIncident = 8;
    int counter = 0;
    BsonDocument resumeToken = null;
    while (cursor.hasNext() && counter != indexOfIncident) {
        ChangeStreamDocument<Grade> event = cursor.next();
        if (indexOfOperationToRestartFrom == counter) {
            resumeToken = event.getResumeToken();
        }
        System.out.println(event);
        counter++;
    }
    System.out.println("==> Let's imagine something wrong happened and I need to restart my Change Stream.");
    System.out.println("==> Starting from resumeToken=" + resumeToken);
    assert resumeToken != null;
    grades.watch(pipeline).resumeAfter(resumeToken).forEach(printEvent());
}
```

For this final example, the same as earlier. Uncomment the part 5 (which is just calling the method above) and start `ChangeStreams.java` then `Update.java`.

This is the output you should get:

``` json
==> Going through the stream a first time & record a resumeToken
ChangeStreamDocument{ operationType=OperationType{value='update'}, resumeToken={"_data": "825E2FC276000000012B022C0100296E5A100496C525567BB74BD28BFD504F987082C046645F696400645E27BCCE74AA51A0486763FE0004"}, namespace=sample_training.grades, destinationNamespace=null, fullDocument=null, documentKey={"_id": {"$oid": "5e27bcce74aa51a0486763fe"}}, clusterTime=Timestamp{value=6786856975532556289, seconds=1580188278, inc=1}, updateDescription=UpdateDescription{removedFields=[], updatedFields={"comments.14": "You will learn a lot if you read the MongoDB blog!"}}, txnNumber=null, lsid=null}
ChangeStreamDocument{ operationType=OperationType{value='update'}, resumeToken={"_data": "825E2FC276000000022B022C0100296E5A100496C525567BB74BD28BFD504F987082C046645F696400645E27BCC9F94B5117D894CBBA0004"}, namespace=sample_training.grades, destinationNamespace=null, fullDocument=null, documentKey={"_id": {"$oid": "5e27bcc9f94b5117d894cbba"}}, clusterTime=Timestamp{value=6786856975532556290, seconds=1580188278, inc=2}, updateDescription=UpdateDescription{removedFields=[], updatedFields={"comments.15": "You will learn a lot if you read the MongoDB blog!"}}, txnNumber=null, lsid=null}
ChangeStreamDocument{ operationType=OperationType{value='update'}, resumeToken={"_data": "825E2FC276000000032B022C0100296E5A100496C525567BB74BD28BFD504F987082C046645F696400645E27BCC9F94B5117D894CBBB0004"}, namespace=sample_training.grades, destinationNamespace=null, fullDocument=null, documentKey={"_id": {"$oid": "5e27bcc9f94b5117d894cbbb"}}, clusterTime=Timestamp{value=6786856975532556291, seconds=1580188278, inc=3}, updateDescription=UpdateDescription{removedFields=[], updatedFields={"comments.14": "You will learn a lot if you read the MongoDB blog!"}}, txnNumber=null, lsid=null}
ChangeStreamDocument{ operationType=OperationType{value='update'}, resumeToken={"_data": "825E2FC276000000042B022C0100296E5A100496C525567BB74BD28BFD504F987082C046645F696400645E27BCC9F94B5117D894CBBC0004"}, namespace=sample_training.grades, destinationNamespace=null, fullDocument=null, documentKey={"_id": {"$oid": "5e27bcc9f94b5117d894cbbc"}}, clusterTime=Timestamp{value=6786856975532556292, seconds=1580188278, inc=4}, updateDescription=UpdateDescription{removedFields=[], updatedFields={"comments.14": "You will learn a lot if you read the MongoDB blog!"}}, txnNumber=null, lsid=null}
ChangeStreamDocument{ operationType=OperationType{value='update'}, resumeToken={"_data": "825E2FC276000000052B022C0100296E5A100496C525567BB74BD28BFD504F987082C046645F696400645E27BCC9F94B5117D894CBBD0004"}, namespace=sample_training.grades, destinationNamespace=null, fullDocument=null, documentKey={"_id": {"$oid": "5e27bcc9f94b5117d894cbbd"}}, clusterTime=Timestamp{value=6786856975532556293, seconds=1580188278, inc=5}, updateDescription=UpdateDescription{removedFields=[], updatedFields={"comments.14": "You will learn a lot if you read the MongoDB blog!"}}, txnNumber=null, lsid=null}
ChangeStreamDocument{ operationType=OperationType{value='update'}, resumeToken={"_data": "825E2FC276000000062B022C0100296E5A100496C525567BB74BD28BFD504F987082C046645F696400645E27BCC9F94B5117D894CBBE0004"}, namespace=sample_training.grades, destinationNamespace=null, fullDocument=null, documentKey={"_id": {"$oid": "5e27bcc9f94b5117d894cbbe"}}, clusterTime=Timestamp{value=6786856975532556294, seconds=1580188278, inc=6}, updateDescription=UpdateDescription{removedFields=[], updatedFields={"comments.14": "You will learn a lot if you read the MongoDB blog!"}}, txnNumber=null, lsid=null}
ChangeStreamDocument{ operationType=OperationType{value='update'}, resumeToken={"_data": "825E2FC276000000072B022C0100296E5A100496C525567BB74BD28BFD504F987082C046645F696400645E27BCC9F94B5117D894CBBF0004"}, namespace=sample_training.grades, destinationNamespace=null, fullDocument=null, documentKey={"_id": {"$oid": "5e27bcc9f94b5117d894cbbf"}}, clusterTime=Timestamp{value=6786856975532556295, seconds=1580188278, inc=7}, updateDescription=UpdateDescription{removedFields=[], updatedFields={"comments.14": "You will learn a lot if you read the MongoDB blog!"}}, txnNumber=null, lsid=null}
ChangeStreamDocument{ operationType=OperationType{value='update'}, resumeToken={"_data": "825E2FC276000000082B022C0100296E5A100496C525567BB74BD28BFD504F987082C046645F696400645E27BCC9F94B5117D894CBC00004"}, namespace=sample_training.grades, destinationNamespace=null, fullDocument=null, documentKey={"_id": {"$oid": "5e27bcc9f94b5117d894cbc0"}}, clusterTime=Timestamp{value=6786856975532556296, seconds=1580188278, inc=8}, updateDescription=UpdateDescription{removedFields=[], updatedFields={"comments.14": "You will learn a lot if you read the MongoDB blog!"}}, txnNumber=null, lsid=null}
==> Let's imagine something wrong happened and I need to restart my Change Stream.
==> Starting from resumeToken={"_data": "825E2FC276000000062B022C0100296E5A100496C525567BB74BD28BFD504F987082C046645F696400645E27BCC9F94B5117D894CBBE0004"}
ChangeStreamDocument{ operationType=OperationType{value='update'}, resumeToken={"_data": "825E2FC276000000072B022C0100296E5A100496C525567BB74BD28BFD504F987082C046645F696400645E27BCC9F94B5117D894CBBF0004"}, namespace=sample_training.grades, destinationNamespace=null, fullDocument=null, documentKey={"_id": {"$oid": "5e27bcc9f94b5117d894cbbf"}}, clusterTime=Timestamp{value=6786856975532556295, seconds=1580188278, inc=7}, updateDescription=UpdateDescription{removedFields=[], updatedFields={"comments.14": "You will learn a lot if you read the MongoDB blog!"}}, txnNumber=null, lsid=null}
ChangeStreamDocument{ operationType=OperationType{value='update'}, resumeToken={"_data": "825E2FC276000000082B022C0100296E5A100496C525567BB74BD28BFD504F987082C046645F696400645E27BCC9F94B5117D894CBC00004"}, namespace=sample_training.grades, destinationNamespace=null, fullDocument=null, documentKey={"_id": {"$oid": "5e27bcc9f94b5117d894cbc0"}}, clusterTime=Timestamp{value=6786856975532556296, seconds=1580188278, inc=8}, updateDescription=UpdateDescription{removedFields=[], updatedFields={"comments.14": "You will learn a lot if you read the MongoDB blog!"}}, txnNumber=null, lsid=null}
ChangeStreamDocument{ operationType=OperationType{value='update'}, resumeToken={"_data": "825E2FC276000000092B022C0100296E5A100496C525567BB74BD28BFD504F987082C046645F696400645E27BCC9F94B5117D894CBC10004"}, namespace=sample_training.grades, destinationNamespace=null, fullDocument=null, documentKey={"_id": {"$oid": "5e27bcc9f94b5117d894cbc1"}}, clusterTime=Timestamp{value=6786856975532556297, seconds=1580188278, inc=9}, updateDescription=UpdateDescription{removedFields=[], updatedFields={"comments.14": "You will learn a lot if you read the MongoDB blog!"}}, txnNumber=null, lsid=null}
ChangeStreamDocument{ operationType=OperationType{value='update'}, resumeToken={"_data": "825E2FC2760000000A2B022C0100296E5A100496C525567BB74BD28BFD504F987082C046645F696400645E27BCC9F94B5117D894CBC20004"}, namespace=sample_training.grades, destinationNamespace=null, fullDocument=null, documentKey={"_id": {"$oid": "5e27bcc9f94b5117d894cbc2"}}, clusterTime=Timestamp{value=6786856975532556298, seconds=1580188278, inc=10}, updateDescription=UpdateDescription{removedFields=[], updatedFields={"comments.14": "You will learn a lot if you read the MongoDB blog!"}}, txnNumber=null, lsid=null}
ChangeStreamDocument{ operationType=OperationType{value='update'}, resumeToken={"_data": "825E2FC2760000000B2B022C0100296E5A100496C525567BB74BD28BFD504F987082C046645F696400645E27BCC9F94B5117D894CBC30004"}, namespace=sample_training.grades, destinationNamespace=null, fullDocument=null, documentKey={"_id": {"$oid": "5e27bcc9f94b5117d894cbc3"}}, clusterTime=Timestamp{value=6786856975532556299, seconds=1580188278, inc=11}, updateDescription=UpdateDescription{removedFields=[], updatedFields={"comments.14": "You will learn a lot if you read the MongoDB blog!"}}, txnNumber=null, lsid=null}
ChangeStreamDocument{ operationType=OperationType{value='update'}, resumeToken={"_data": "825E2FC2760000000D2B022C0100296E5A100496C525567BB74BD28BFD504F987082C046645F696400645E27BCC8F94B5117D894CBB90004"}, namespace=sample_training.grades, destinationNamespace=null, fullDocument=null, documentKey={"_id": {"$oid": "5e27bcc8f94b5117d894cbb9"}}, clusterTime=Timestamp{value=6786856975532556301, seconds=1580188278, inc=13}, updateDescription=UpdateDescription{removedFields=[], updatedFields={"scores.0.score": 904745.0267635228, "x": 150}}, txnNumber=null, lsid=null}
ChangeStreamDocument{ operationType=OperationType{value='update'}, resumeToken={"_data": "825E2FC2760000000F2B022C0100296E5A100496C525567BB74BD28BFD504F987082C046645F696400645E27BCC9F94B5117D894CBBA0004"}, namespace=sample_training.grades, destinationNamespace=null, fullDocument=null, documentKey={"_id": {"$oid": "5e27bcc9f94b5117d894cbba"}}, clusterTime=Timestamp{value=6786856975532556303, seconds=1580188278, inc=15}, updateDescription=UpdateDescription{removedFields=[], updatedFields={"scores.0.score": 2126144.0353088505, "x": 150}}, txnNumber=null, lsid=null}
```

As you can see here, I was able to stop reading my Change Stream and, from the `resumeToken` I collected earlier, I can start a new Change Stream from this point in time.

## Final Code

`ChangeStreams.java` ([code](https://github.com/mongodb-developer/java-quick-start/blob/master/src/main/java/com/mongodb/quickstart/ChangeStreams.java)):

``` java
package com.mongodb.quickstart;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.client.*;
import com.mongodb.client.model.changestream.ChangeStreamDocument;
import com.mongodb.quickstart.models.Grade;
import org.bson.BsonDocument;
import org.bson.codecs.configuration.CodecRegistry;
import org.bson.codecs.pojo.PojoCodecProvider;
import org.bson.conversions.Bson;

import java.util.List;
import java.util.function.Consumer;

import static com.mongodb.client.model.Aggregates.match;
import static com.mongodb.client.model.Filters.eq;
import static com.mongodb.client.model.Filters.in;
import static com.mongodb.client.model.changestream.FullDocument.UPDATE_LOOKUP;
import static org.bson.codecs.configuration.CodecRegistries.fromProviders;
import static org.bson.codecs.configuration.CodecRegistries.fromRegistries;

public class ChangeStreams {

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
            List<Bson> pipeline;

            // Only uncomment one example at a time. Follow instructions for each individually then kill all remaining processes.

            /** => Example 1: print all the write operations.
             *  => Start "ChangeStreams" then "MappingPOJOs" to see some change events.
             */
            grades.watch().forEach(printEvent());

            /** => Example 2: print only insert and delete operations.
             *  => Start "ChangeStreams" then "MappingPOJOs" to see some change events.
             */
//             pipeline = List.of(match(in("operationType", List.of("insert", "delete"))));
//             grades.watch(pipeline).forEach(printEvent());

            /** => Example 3: print only updates without fullDocument.
             *  => Start "ChangeStreams" then "Update" to see some change events (start "Create" before if not done earlier).
             */
//             pipeline = List.of(match(eq("operationType", "update")));
//             grades.watch(pipeline).forEach(printEvent());

            /** => Example 4: print only updates with fullDocument.
             *  => Start "ChangeStreams" then "Update" to see some change events.
             */
//             pipeline = List.of(match(eq("operationType", "update")));
//             grades.watch(pipeline).fullDocument(UPDATE_LOOKUP).forEach(printEvent());

            /**
             * => Example 5: iterating using a cursor and a while loop + remembering a resumeToken then restart the Change Streams.
             * => Start "ChangeStreams" then "Update" to see some change events.
             */
//             exampleWithResumeToken(grades);
        }
    }

    private static void exampleWithResumeToken(MongoCollection<Grade> grades) {
        List<Bson> pipeline = List.of(match(eq("operationType", "update")));
        ChangeStreamIterable<Grade> changeStream = grades.watch(pipeline);
        MongoChangeStreamCursor<ChangeStreamDocument<Grade>> cursor = changeStream.cursor();
        System.out.println("==> Going through the stream a first time & record a resumeToken");
        int indexOfOperationToRestartFrom = 5;
        int indexOfIncident = 8;
        int counter = 0;
        BsonDocument resumeToken = null;
        while (cursor.hasNext() && counter != indexOfIncident) {
            ChangeStreamDocument<Grade> event = cursor.next();
            if (indexOfOperationToRestartFrom == counter) {
                resumeToken = event.getResumeToken();
            }
            System.out.println(event);
            counter++;
        }
        System.out.println("==> Let's imagine something wrong happened and I need to restart my Change Stream.");
        System.out.println("==> Starting from resumeToken=" + resumeToken);
        assert resumeToken != null;
        grades.watch(pipeline).resumeAfter(resumeToken).forEach(printEvent());
    }

    private static Consumer<ChangeStreamDocument<Grade>> printEvent() {
        return System.out::println;
    }
}
```

>Remember to uncomment only one Change Stream example at a time.

## Wrapping Up

Change Streams are very easy to use and setup in MongoDB. They are the key to any real-time processing system.

The only remaining problem here is how to get this in production correctly. Change Streams are basically an infinite loop, processing an infinite stream of events. Multiprocessing is, of course, a must-have for this kind of setup, especially if your processing time is greater than the time separating 2 events.

Scaling up correctly a Change Stream data processing pipeline can be tricky. That's why you can implement this easily using [MongoDB Triggers in MongoDB Realm](https://docs.mongodb.com/realm/triggers/database-triggers/).

You can check out my [MongoDB Realm sample application](https://github.com/MaBeuLux88/mongodb-stitch-movie-collection) if you want to see a real example with several Change Streams in action.

>If you want to learn more and deepen your knowledge faster, I recommend you check out the M220J: MongoDB for Java Developers training available for free on [MongoDB University](https://university.mongodb.com/).

In the next blog post, I will show you multi-document ACID transactions in Java.
