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
-   The Java Driver logging is now enabled via the popular [SLF4J](http://www.slf4j.org/) API so, I added logback in the `pom.xml` and a configuration file `logback.xml`.

## What's the Aggregation Pipeline?

<div>
    <img style="float: right;
        border-radius: 10px;
        margin-bottom: 30px;
        vertical-align: bottom;
        width: 30%;"
        src="https://mongodb-devhub-cms.s3.us-west-1.amazonaws.com/old_images/qs-badges/qs-badge-java.png" alt="Java badge" />

The [aggregation pipeline](https://docs.mongodb.com/manual/core/aggregation-pipeline/) is a framework for data aggregation modeled on the concept of data processing pipelines, just like the "pipe" in the Linux Shell. Documents enter a multi-stage pipeline that transforms the documents into aggregated results.
</div>

It's the most powerful way to work with your data in MongoDB. It will allow us to make advanced queries like grouping documents, manipulate arrays, reshape document models, etc.

Let's see how we can harvest this power using Java.

## Getting Set Up

I will use the same repository as usual in this series. If you don't have a copy of it yet, you can clone it or just update it if you already have it:

``` sh
git clone https://github.com/mongodb-developer/java-quick-start
```

>If you didn't set up your free cluster on MongoDB Atlas, now is great time to do so. You have all the instructions in this [blog post](/quickstart/free-atlas-cluster/).

## First Example with Zips

In the [MongoDB Sample Dataset](https://docs.atlas.mongodb.com/sample-data/available-sample-datasets/) in [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/), let's explore a bit the `zips` collection in the `sample_training` database.

``` javascript
MongoDB Enterprise Cluster0-shard-0:PRIMARY> db.zips.find({city:"NEW YORK"}).limit(2).pretty()
{
    "_id" : ObjectId("5c8eccc1caa187d17ca72f8a"),
    "city" : "NEW YORK",
    "zip" : "10001",
    "loc" : {
        "y" : 40.74838,
        "x" : 73.996705
    },
    "pop" : 18913,
    "state" : "NY"
}
{
    "_id" : ObjectId("5c8eccc1caa187d17ca72f8b"),
    "city" : "NEW YORK",
    "zip" : "10003",
    "loc" : {
        "y" : 40.731253,
        "x" : 73.989223
    },
    "pop" : 51224,
    "state" : "NY"
}
```

As you can see, we have one document for each zip code in the USA and for each, we have the associated population.

To calculate the population of New York, I would have to sum the population of each zip code to get the population of the entire city.

Let's try to find the 3 biggest cities in the state of Texas. Let's design this on paper first.

- I don't need to work with the entire collection. I need to filter only the cities in Texas.
- Once this is done, I can regroup all the zip code from a same city together to get the total population.
- Then I can order my cities by descending order or population.
- Finally, I can keep the first 3 cities of my list.

The easiest way to build this pipeline in MongoDB is to use the [aggregation pipeline builder](https://docs.mongodb.com/compass/master/aggregation-pipeline-builder/) that is available in [MongoDB Compass](https://www.mongodb.com/products/compass) or in [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/) in the `Collections` tab.

Once this is done, you can [export your pipeline to Java](https://docs.mongodb.com/compass/master/export-pipeline-to-language/) using the export button.

After a little code refactoring, here is what I have:

``` java
/**
 * find the 3 most densely populated cities in Texas.
 * @param zips sample_training.zips collection from the MongoDB Sample Dataset in MongoDB Atlas.
 */
private static void threeMostPopulatedCitiesInTexas(MongoCollection<Document> zips) {
    Bson match = match(eq("state", "TX"));
    Bson group = group("$city", sum("totalPop", "$pop"));
    Bson project = project(fields(excludeId(), include("totalPop"), computed("city", "$_id")));
    Bson sort = sort(descending("totalPop"));
    Bson limit = limit(3);

    List<Document> results = zips.aggregate(List.of(match, group, project, sort, limit)).into(new ArrayList<>());
    System.out.println("==> 3 most densely populated cities in Texas");
    results.forEach(printDocuments());
}
```

The MongoDB driver provides a lot of helpers to make the code easy to write and to read.

As you can see, I solved this problem with:

- A [$match stage](https://docs.mongodb.com/manual/reference/operator/aggregation/match/) to filter my documents and keep only the zip code in Texas,
- A [$group stage](https://docs.mongodb.com/manual/reference/operator/aggregation/group/) to regroup my zip codes in cities,
- A [$project stage](https://docs.mongodb.com/manual/reference/operator/aggregation/project/) to rename the field `_id` in `city` for a clean output (not mandatory but I'm classy),
- A [$sort stage](https://docs.mongodb.com/manual/reference/operator/aggregation/sort/) to sort by population descending,
- A [$limit stage](https://docs.mongodb.com/manual/reference/operator/aggregation/limit/) to keep only the 3 most populated cities.

Here is the output we get:

``` json
==> 3 most densely populated cities in Texas
{
  "totalPop": 2095918,
  "city": "HOUSTON"
}
{
  "totalPop": 940191,
  "city": "DALLAS"
}
{
  "totalPop": 811792,
  "city": "SAN ANTONIO"
}
```

In MongoDB 4.2, there are 30 different aggregation pipeline stages that you can use to manipulate your documents. If you want to know more, I encourage you to follow this course on MongoDB University: [M121: The MongoDB Aggregation Framework](https://university.mongodb.com/courses/M121/about).

## Second Example with Posts

This time, I'm using the collection `posts` in the same database.

``` json
MongoDB Enterprise Cluster0-shard-0:PRIMARY> db.posts.findOne()
{
    "_id" : ObjectId("50ab0f8bbcf1bfe2536dc3f9"),
    "body" : "Amendment I\n<p>Congress shall make no law respecting an establishment of religion, or prohibiting the free exercise thereof; or abridging the freedom of speech, or of the press; or the right of the people peaceably to assemble, and to petition the Government for a redress of grievances.\n<p>\nAmendment II\n<p>\nA well regulated Militia, being necessary to the security of a free State, the right of the people to keep and bear Arms, shall not be infringed.\n<p>\nAmendment III\n<p>\nNo Soldier shall, in time of peace be quartered in any house, without the consent of the Owner, nor in time of war, but in a manner to be prescribed by law.\n<p>\nAmendment IV\n<p>\nThe right of the people to be secure in their persons, houses, papers, and effects, against unreasonable searches and seizures, shall not be violated, and no Warrants shall issue, but upon probable cause, supported by Oath or affirmation, and particularly describing the place to be searched, and the persons or things to be seized.\n<p>\nAmendment V\n<p>\nNo person shall be held to answer for a capital, or otherwise infamous crime, unless on a presentment or indictment of a Grand Jury, except in cases arising in the land or naval forces, or in the Militia, when in actual service in time of War or public danger; nor shall any person be subject for the same offence to be twice put in jeopardy of life or limb; nor shall be compelled in any criminal case to be a witness against himself, nor be deprived of life, liberty, or property, without due process of law; nor shall private property be taken for public use, without just compensation.\n<p>\n\nAmendment VI\n<p>\nIn all criminal prosecutions, the accused shall enjoy the right to a speedy and public trial, by an impartial jury of the State and district wherein the crime shall have been committed, which district shall have been previously ascertained by law, and to be informed of the nature and cause of the accusation; to be confronted with the witnesses against him; to have compulsory process for obtaining witnesses in his favor, and to have the Assistance of Counsel for his defence.\n<p>\nAmendment VII\n<p>\nIn Suits at common law, where the value in controversy shall exceed twenty dollars, the right of trial by jury shall be preserved, and no fact tried by a jury, shall be otherwise re-examined in any Court of the United States, than according to the rules of the common law.\n<p>\nAmendment VIII\n<p>\nExcessive bail shall not be required, nor excessive fines imposed, nor cruel and unusual punishments inflicted.\n<p>\nAmendment IX\n<p>\nThe enumeration in the Constitution, of certain rights, shall not be construed to deny or disparage others retained by the people.\n<p>\nAmendment X\n<p>\nThe powers not delegated to the United States by the Constitution, nor prohibited by it to the States, are reserved to the States respectively, or to the people.\"\n<p>\n",
    "permalink" : "aRjNnLZkJkTyspAIoRGe",
    "author" : "machine",
    "title" : "Bill of Rights",
    "tags" : [
        "watchmaker",
        "santa",
        "xylophone",
        "math",
        "handsaw",
        "dream",
        "undershirt",
        "dolphin",
        "tanker",
        "action"
    ],
    "comments" : [
        {
            "body" : "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum",
            "email" : "HvizfYVx@pKvLaagH.com",
            "author" : "Santiago Dollins"
        },
        {
            "body" : "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum",
            "email" : "glbeRCMi@KwnNwhzl.com",
            "author" : "Omar Bowdoin"
        }
    ],
    "date" : ISODate("2012-11-20T05:05:15.231Z")
}
```

This collection of 500 posts has been generated artificially, but it contains arrays and I want to show you how we can manipulate arrays in a pipeline.

Let's try to find the three most popular tags and for each tag, I also want the list of post titles they are tagging.

Here is my solution in Java.

``` java
/**
 * find the 3 most popular tags and their post titles
 * @param posts sample_training.posts collection from the MongoDB Sample Dataset in MongoDB Atlas.
 */
private static void threeMostPopularTags(MongoCollection<Document> posts) {
    Bson unwind = unwind("$tags");
    Bson group = group("$tags", sum("count", 1L), push("titles", "$title"));
    Bson sort = sort(descending("count"));
    Bson limit = limit(3);
    Bson project = project(fields(excludeId(), computed("tag", "$_id"), include("count", "titles")));

    List<Document> results = posts.aggregate(List.of(unwind, group, sort, limit, project)).into(new ArrayList<>());
    System.out.println("==> 3 most popular tags and their posts titles");
    results.forEach(printDocuments());
}
```

Here I'm using the very useful [$unwind stage](https://docs.mongodb.com/manual/reference/operator/aggregation/unwind/) to break down my array of tags.

It allows me in the following $group stage to group my tags, count the posts and collect the titles in a new array `titles`.

Here is the final output I get.

``` json
==> 3 most popular tags and their posts titles
{
  "count": 8,
  "titles": [
    "Gettysburg Address",
    "US Constitution",
    "Bill of Rights",
    "Gettysburg Address",
    "Gettysburg Address",
    "Declaration of Independence",
    "Bill of Rights",
    "Declaration of Independence"
  ],
  "tag": "toad"
}
{
  "count": 8,
  "titles": [
    "Bill of Rights",
    "Gettysburg Address",
    "Bill of Rights",
    "Bill of Rights",
    "Declaration of Independence",
    "Declaration of Independence",
    "Bill of Rights",
    "US Constitution"
  ],
  "tag": "forest"
}
{
  "count": 8,
  "titles": [
    "Bill of Rights",
    "Declaration of Independence",
    "Declaration of Independence",
    "Gettysburg Address",
    "US Constitution",
    "Bill of Rights",
    "US Constitution",
    "US Constitution"
  ],
  "tag": "hair"
}
```

As you can see, some titles are repeated. As I said earlier, the collection was generated so the post titles are not uniq. I could solve this "problem" by using the [$addToSet operator](https://docs.mongodb.com/manual/reference/operator/aggregation/addToSet/index.html) instead of the [$push](https://docs.mongodb.com/manual/reference/operator/aggregation/push/) one if this was really an issue.

## Final Code

``` java
package com.mongodb.quickstart;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;
import org.bson.conversions.Bson;
import org.bson.json.JsonWriterSettings;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Consumer;

import static com.mongodb.client.model.Accumulators.push;
import static com.mongodb.client.model.Accumulators.sum;
import static com.mongodb.client.model.Aggregates.*;
import static com.mongodb.client.model.Filters.eq;
import static com.mongodb.client.model.Projections.*;
import static com.mongodb.client.model.Sorts.descending;

public class AggregationFramework {

    public static void main(String[] args) {
        String connectionString = System.getProperty("mongodb.uri");
        try (MongoClient mongoClient = MongoClients.create(connectionString)) {
            MongoDatabase db = mongoClient.getDatabase("sample_training");
            MongoCollection<Document> zips = db.getCollection("zips");
            MongoCollection<Document> posts = db.getCollection("posts");
            threeMostPopulatedCitiesInTexas(zips);
            threeMostPopularTags(posts);
        }
    }

    /**
     * find the 3 most densely populated cities in Texas.
     *
     * @param zips sample_training.zips collection from the MongoDB Sample Dataset in MongoDB Atlas.
     */
    private static void threeMostPopulatedCitiesInTexas(MongoCollection<Document> zips) {
        Bson match = match(eq("state", "TX"));
        Bson group = group("$city", sum("totalPop", "$pop"));
        Bson project = project(fields(excludeId(), include("totalPop"), computed("city", "$_id")));
        Bson sort = sort(descending("totalPop"));
        Bson limit = limit(3);

        List<Document> results = zips.aggregate(List.of(match, group, project, sort, limit)).into(new ArrayList<>());
        System.out.println("==> 3 most densely populated cities in Texas");
        results.forEach(printDocuments());
    }

    /**
     * find the 3 most popular tags and their post titles
     *
     * @param posts sample_training.posts collection from the MongoDB Sample Dataset in MongoDB Atlas.
     */
    private static void threeMostPopularTags(MongoCollection<Document> posts) {
        Bson unwind = unwind("$tags");
        Bson group = group("$tags", sum("count", 1L), push("titles", "$title"));
        Bson sort = sort(descending("count"));
        Bson limit = limit(3);
        Bson project = project(fields(excludeId(), computed("tag", "$_id"), include("count", "titles")));

        List<Document> results = posts.aggregate(List.of(unwind, group, sort, limit, project)).into(new ArrayList<>());
        System.out.println("==> 3 most popular tags and their posts titles");
        results.forEach(printDocuments());
    }

    private static Consumer<Document> printDocuments() {
        return doc -> System.out.println(doc.toJson(JsonWriterSettings.builder().indent(true).build()));
    }
}
```

## Wrapping Up

The aggregation pipeline is very powerful. We have just scratched the surface with these two examples but trust me if I tell you that it's your best ally if you can master it.

>I encourage you to follow the [M121 course on MongoDB University](https://university.mongodb.com/courses/M121/about) to become an aggregation pipeline jedi.
>
>If you want to learn more and deepen your knowledge faster, I recommend you check out the M220J: MongoDB for Java Developers training available for free on [MongoDB University](https://university.mongodb.com/).

In the next blog post, I will explain to you the [Change Streams](https://docs.mongodb.com/manual/changeStreams/) in Java.
