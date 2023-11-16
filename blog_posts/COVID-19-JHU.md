## TL;DR

Our MongoDB Cluster is running in version 4.4.1.

You can connect to it using MongoDB Compass, the Mongo Shell, SQL or any MongoDB driver supporting at least MongoDB 4.4 with the following URI:

``` none
mongodb+srv://readonly:readonly@covid-19.hip2i.mongodb.net/covid19
```

>
>
>`readonly` is the username and the password, they are not meant to be replaced.
>
>

## Updates

### December 10th, 2020

-   Upgraded the cluster to 4.4.
-   Improved the python data import script to calculate the daily values using the existing cumulative values with an [Aggregation Pipeline](https://docs.mongodb.com/manual/core/aggregation-pipeline/).
    -   confirmed_daily.
    -   deaths_daily.
    -   recovered_daily.

### May 13th, 2020

-   Renamed the field "city" to "county" and "cities" to "counties" where appropriate. They contains the data from the column "Admin2" in JHU CSVs.

### May 6th, 2020

-   The `covid19` database now has 5 collections. More details in our [README.md](https://github.com/mongodb-developer/open-data-covid-19/blob/master/README.md).
-   The `covid19.statistics` collection is renamed `covid19.global_and_us` for more clarity.
-  [Maxime's Charts](/article/coronavirus-map-live-data-tracker-charts) are now using the `covid19.global_and_us` collection.
-   The dataset is updated hourly so any commit done by JHU will be reflected at most one hour later in our cluster.

## Table of Contents

- [Introduction](#introduction)
- [The MongoDB Dataset](#the-mongodb-dataset)
- [Get Started](#get-started)
    - [Explore the Dataset with MongoDB Charts](#explore-the-dataset-with-mongodb-charts)
    - [Explore the Dataset with MongoDB Compass](#explore-the-dataset-with-mongodb-compass)
    - [Explore the Dataset with the MongoDB Shell](#explore-the-dataset-with-the-mongodb-shell)
    - [Accessing the Data with Java](#accessing-the-data-with-java)
    - [Accessing the Data with Node.js](#accessing-the-data-with-node-js)
    - [Accessing the Data with Python](#accessing-the-data-with-python)
    - [Accessing the Data with Golang](#accessing-the-data-with-golang)
    - [Accessing the Data with Google Colaboratory](#accessing-the-data-with-google-colaboratory)
    - [Accessing the Data with Business Intelligence Tools](#accessing-the-data-with-business-intelligence-tools)
    - [Accessing the Data with any SQL tool](#accessing-the-data-with-any-sql-tool)
    - [Take a copy of the data](#take-a-copy-of-the-data)
- [Wrap up](#wrap-up)
- [Sources](#sources)

## Introduction

As the COVID-19 pandemic has swept the globe, the work of [JHU (Johns Hopkins University)](https://www.jhu.edu/) and its [COVID-19 dashboard](https://coronavirus.jhu.edu/map.html) has become vitally important in keeping people informed about the progress of the virus in their communities, in their countries, and in the world.

JHU not only publishes their dashboard, but [they make the data powering it freely available for anyone to use](https://github.com/CSSEGISandData/COVID-19). However, their data is delivered as flat CSV files which you need to download each time to then query. We've set out to make that up-to-date data more accessible so people could build other analyses and applications directly on top of the data set.

We are now hosting a service with a frequently updated copy of the JHU data in MongoDB Atlas, our database in the cloud. This data is free for anyone to query using the MongoDB Query language and/or SQL. We also support a [variety of BI tools directly](https://docs.atlas.mongodb.com/bi-connection/) so you can query the data with Tableau, Qlik and Excel.

With the MongoDB COVID-19 dataset there will be no more manual downloads and no more frequent format changes. With this data set, this service will deliver a consistent JSON and SQL view every day with no downstream [ETL](https://www.webopedia.com/TERM/E/ETL.html) required.

None of the actual data is modified. It is simply structured to make it easier to query by placing it within a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster and by creating some convenient APIs.

## The MongoDB Dataset

All the data we use to create the MongoDB COVID-19 dataset comes from the [JHU](https://www.jhu.edu/) dataset. In their turn, here are the sources they are using:

-   the World Health Organization,
-   the National Health Commission of the People's Republic of China,
-   the United States Centre for Disease Control,
-   the Australia Government Department of Health,
-   the European Centre for Disease Prevention and Control,
-   and many others.

You can read the [full list on their GitHub repository](https://github.com/CSSEGISandData/COVID-19).

Using the CSV files they provide, we are producing two different databases in our cluster.

-   `covid19jhu` contains the raw CSV files imported with the [mongoimport](https://docs.mongodb.com/manual/reference/program/mongoimport/) tool,
-   `covid19` contains the same dataset but with a clean MongoDB schema design with all the good practices we are recommending.

Here is an example of a document in the `covid19` database:

``` javascript
{
  "_id" : ObjectId("5e957bfcbd78b2f11ba349bf"),
  "uid" : 312,
  "country_iso2" : "GP",
  "country_iso3" : "GLP",
  "country_code" : 312,
  "state" : "Guadeloupe",
  "country" : "France",
  "combined_name" : "Guadeloupe, France",
  "population" : 400127,
  "loc" : {
    "type" : "Point",
    "coordinates" : [ -61.551, 16.265 ]
  },
  "date" : ISODate("2020-04-13T00:00:00Z"),
  "confirmed" : 143,
  "deaths" : 8,
  "recovered" : 67
}
```

The document above was obtained by joining together the file `UID_ISO_FIPS_LookUp_Table.csv` and the CSV files time series you can find in [this folder](https://github.com/CSSEGISandData/COVID-19/tree/master/csse_covid_19_data/csse_covid_19_time_series).

Some fields might not exist in all the documents because they are not relevant or are just not provided by [JHU](https://www.jhu.edu/). If you want more details, run a schema analysis with [MongoDB Compass](https://www.mongodb.com/products/compass) on the different collections available.

If you would prefer to host the data yourself, the scripts required to download and transform the JHU data are open-source. You can [view them and instructions for how to use them on our GitHub repository](https://github.com/mongodb-developer/open-data-covid-19/tree/master/data-import).

In the `covid19` database, you will find 5 collections which are detailed in our [Github repository README.md file](https://github.com/mongodb-developer/open-data-covid-19/blob/master/README.md).

-   metadata
-   global (the data from the time series global files)
-   us_only (the data from the time series US files)
-   global_and_us (the most complete one)
-   countries_summary (same as global but countries are grouped in a single doc for each date)

## Get Started

You can begin exploring the data right away without any MongoDB or programming experience using [MongoDB Charts](https://www.mongodb.com/products/charts) or [MongoDB Compass](https://www.mongodb.com/products/compass).

In the following sections, we will also show you how to consume this dataset using the Java, Node.js and Python drivers.

We will show you how to perform the following queries in each language:

-   Retrieve the last 5 days of data for a given place,
-   Retrieve all the data for the last day,
-   Make a geospatial query to retrieve data within a certain distance of a given place.

### Explore the Dataset with MongoDB Charts

With [Charts](https://www.mongodb.com/products/charts), you can create visualisations of the data using any of the pre-built graphs and charts.  You can then [arrange this into a unique dashboard](https://charts.mongodb.com/charts-open-data-covid-19-zddgb/public/dashboards/60da4f45-f168-434a-82f6-d37ce88ff9ea), or embed the charts in your pages or blogs.

:charts[]{url=https://charts.mongodb.com/charts-open-data-covid-19-zddgb id=60da4f45-f168-4266-8264-d37ce88ff9fa theme=light autorefresh=3600}

>
>
>If you want to create your own MongoDB Charts dashboard, you will need to set up your own [Free MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster and import the dataset in your cluster using the [import scripts](https://github.com/mongodb-developer/open-data-covid-19/tree/master/data-import) or use `mongoexport & mongoimport` or `mongodump & mongorestore`. See this section for more details: [Take a copy of the data](#take-a-copy-of-the-data).
>
>

### Explore the Dataset with MongoDB Compass

[Compass](https://www.mongodb.com/products/compass) allows you to dig deeper into the data using the [MongoDB Query Language](https://docs.mongodb.com/manual/tutorial/query-documents/) or via the [Aggregation Pipeline](https://docs.mongodb.com/manual/core/aggregation-pipeline/) visual editor. Perform a range of operations on the data, [including mathematical, comparison and groupings](https://docs.mongodb.com/manual/meta/aggregation-quick-reference/#operator-expressions).  Create documents that provide unique insights and interpretations. You can use the output from your pipelines as [data-sources for your Charts](https://docs.mongodb.com/charts/saas/data-sources/).

![Screencast showing some of the features of MongoDB Compass for exploring COVID-19 Data](https://mongodb-devhub-cms.s3.us-west-1.amazonaws.com/compass_covid19_screencast_386b271cce.gif)

For MongoDB Compass or your driver, you can use this connection string.

``` 
mongodb+srv://readonly:readonly@covid-19.hip2i.mongodb.net/covid19
```

### Explore the Dataset with the MongoDB Shell

Because we store the data in MongoDB, you can also access it via the [MongoDB Shell](https://docs.mongodb.com/manual/mongo/) or using [any of our drivers](https://docs.mongodb.com/drivers/). We've limited access to these collections to 'read-only'. You can find the connection strings for the shell and Compass below, as well as driver examples for [Java](https://docs.mongodb.com/drivers/java/), [Node.js](https://docs.mongodb.com/drivers/node/), and [Python](https://docs.mongodb.com/drivers/python/) to get you started.

``` shell
mongo "mongodb+srv://covid-19.hip2i.mongodb.net/covid19"  --username readonly --password readonly
```

### Accessing the Data with Java

Our Java examples are available in our [Github Repository Java folder](https://github.com/mongodb-developer/open-data-covid-19/tree/master/java).

#### With the MongoDB Driver

Here is the main class of our Java example. Of course, you need the three POJOs from the [Java Github folder](https://github.com/mongodb-developer/open-data-covid-19/tree/master/java/mongodb-driver/src/main/java/com/mongodb/coronavirus) to make this work.

``` java
package com.mongodb.coronavirus;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.codecs.configuration.CodecRegistry;
import org.bson.codecs.pojo.PojoCodecProvider;
import org.bson.conversions.Bson;

import java.util.Date;

import static com.mongodb.client.model.Filters.*;
import static com.mongodb.client.model.Sorts.descending;
import static org.bson.codecs.configuration.CodecRegistries.fromProviders;
import static org.bson.codecs.configuration.CodecRegistries.fromRegistries;

public class MongoDB {

    public static void main(String[] args) {
        try (MongoClient client = MongoClients.create(getMongoClient())) {
            int earthRadius = 6371;
            MongoDatabase db = client.getDatabase("covid19");
            MongoCollection<GlobalAndUs> globalAndUsCollection = db.getCollection("global_and_us", GlobalAndUs.class);
            MongoCollection<Metadata> metadataCollection = db.getCollection("metadata", Metadata.class);

            System.out.println("Query to get the last 5 entries for France (continent only)");
            Bson franceFilter = eq("country", "France");
            Bson noStateFilter = eq("state", null);
            globalAndUsCollection.find(and(franceFilter, noStateFilter))
                                 .sort(descending("date"))
                                 .limit(5)
                                 .forEach(System.out::println);

            System.out.println("\nQuery to get the last day data (limited to 5 docs here).");
            Metadata metadata = metadataCollection.find().first();
            Date lastDate = metadata.getLastDate();
            Bson lastDayFilter = eq("date", lastDate);
            globalAndUsCollection.find(lastDayFilter).limit(5).forEach(System.out::println);

            System.out.println("\nQuery to get the last day data for all the countries within 500km of Paris.");
            Bson aroundParisFilter = geoWithinCenterSphere("loc", 2.341908, 48.860199, 500.0 / earthRadius);
            globalAndUsCollection.find(and(lastDayFilter, aroundParisFilter)).forEach(System.out::println);

            System.out.println("\nPrint the Metadata summary.");
            metadataCollection.find().forEach(System.out::println);
        }
    }

    private static MongoClientSettings getMongoClient() {
        String connectionString = "mongodb+srv://readonly:readonly@covid-19.hip2i.mongodb.net/covid19";
        CodecRegistry pojoCodecRegistry = fromProviders(PojoCodecProvider.builder().automatic(true).build());
        CodecRegistry codecRegistry = fromRegistries(MongoClientSettings.getDefaultCodecRegistry(), pojoCodecRegistry);
        return MongoClientSettings.builder()
                                  .applyConnectionString(new ConnectionString(connectionString))
                                  .codecRegistry(codecRegistry)
                                  .build();
    }
}
```

### Accessing the Data with Node.js

Our Node.js examples are available in our [Github Repository Node.js folder](https://github.com/mongodb-developer/open-data-covid-19/tree/master/nodejs).

#### With the MongoDB Driver

Check out the instructions in the [Node.js folder](https://github.com/mongodb-developer/open-data-covid-19/tree/master/nodejs/mongodb-driver).

``` javascript
const MongoClient = require("mongodb").MongoClient;

const uri =
  "mongodb+srv://readonly:readonly@covid-19.hip2i.mongodb.net/covid19";

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

client.connect((err) => {
  const covid19Database = client.db("covid19");
  const globalAndUS = covid19Database.collection("global_and_us");
  const metadata = covid19Database.collection("metadata");

  // Query to get the last 5 entries for France (continent only)
  globalAndUS
    .find({ country: "France" })
    .sort(["date", -1])
    .limit(15)
    .toArray((err, docs) => {
      if (err) {
        console.error(err);
      }
      console.log(docs);
    });

  //Query to get the last day data (limited to 5 docs here).
  metadata
    .find()
    .toArray((err, docs) => {
      if (err) {
        console.error(err);
      }
      const lastDate = docs[0].last_date;

      globalAndUS
        .find({ date: { $eq: lastDate } })
        .limit(5)
        .toArray((err, docs) => {
          if (err) {
            console.error(err);
          }
          console.log(docs);
        });
    });

  // Query to get the last day data for all the countries within 500km of Paris.
  const lon = 2.341908;
  const lat = 48.860199;
  const earthRadius = 6371; // km
  const searchRadius = 500; // km

  metadata
    .find()
    .toArray((err, docs) => {
      if (err) {
        console.error(err);
      }
      const lastDate = docs[0].last_date;

      globalAndUS
        .find({
          date: { $eq: lastDate },
          loc: {
            $geoWithin: {
              $centerSphere: [[lon, lat], searchRadius / earthRadius],
            },
          },
        })
        .limit(5)
        .toArray((err, docs) => {
          if (err) {
            console.error(err);
          }
          console.log(docs);
        });
    });
});
```

### Accessing the Data with Python

Our Python examples are available in our [Github Repository Python folder](https://github.com/mongodb-developer/open-data-covid-19/tree/master/python).

#### With the MongoDB Driver

See all the instructions to get started in the [Python folder](https://github.com/mongodb-developer/open-data-covid-19/tree/master/python/mongodb-driver).

``` python
#!python3

import pymongo
from pymongo import MongoClient
from tabulate import tabulate

EARTH_RADIUS = 6371.0
MDB_URL = "mongodb+srv://readonly:readonly@covid-19.hip2i.mongodb.net/covid19"


def main():
    client = MongoClient(MDB_URL)
    db = client.get_database("covid19")
    stats = db.get_collection("global_and_us")
    metadata = db.get_collection("metadata")

    # Get some results for the UK:
    print("\nMost recent 10 global_and_us for the UK:")
    results = (
        stats.find({"country": "United Kingdom", "state": None})
        .sort("date", pymongo.DESCENDING)
        .limit(10)
    )
    print_table(["date", "confirmed", "deaths"], results)

    # Get the last date loaded:
    meta = metadata.find_one()
    last_date = meta["last_date"]

    # Show the 5 locations with the most recovered cases:
    print("\nThe last day's highest reported recoveries:")
    results = (
        stats.find({"date": last_date}).sort("recovered", pymongo.DESCENDING).limit(5)
    )
    print_table(["combined_name", "recovered"], results)

    # Confirmed cases for all countries within 500km of Paris:
    print(
        "\nThe last day's confirmed cases for all the countries within 500km of Paris:"
    )
    results = stats.find(
        {
            "date": last_date,
            "loc": {
                "$geoWithin": {
                    "$centerSphere": [[2.341908, 48.860199], 500.0 / EARTH_RADIUS]
                }
            },
        }
    )
    print_table(["combined_name", "confirmed"], results)


def print_table(doc_keys, search_results, headers=None):
    """
    Utility function to print a query result as a table.

    Params:
        doc_keys: A list of keys for data to be extracted from each document.
        search_results: A MongoDB cursor.
        headers: A list of headers for the table. If not provided, attempts to
            generate something sensible from the provided `doc_keys`
    """
    if headers is None:
        headers = [key.replace("_", " ").replace("-", " ").title() for key in doc_keys]
    records = (extract_tuple(doc, doc_keys) for doc in search_results)
    print(tabulate(records, headers=headers))


def extract_tuple(mapping, keys):
    """
    Extract a tuple from a mapping by requesting a sequence of keys.

    Missing keys will result in `None` values in the resulting tuple.
    """
    return tuple([mapping.get(key) for key in keys])


if __name__ == "__main__":
    main()
```

### Accessing the Data with Golang

Our Golang examples are available in our [Github Repository Golang folder](https://github.com/mongodb-developer/open-data-covid-19/tree/master/golang).

#### With the MongoDB Driver

See all the instructions to get started in the [Golang folder](https://github.com/mongodb-developer/open-data-covid-19/tree/master/golang/mongodb-driver).

``` go
package main

import (
  "context"
  "fmt"
  "os"
  "strconv"
  "time"

  "github.com/olekukonko/tablewriter"
  "go.mongodb.org/mongo-driver/bson"
  "go.mongodb.org/mongo-driver/bson/primitive"
  "go.mongodb.org/mongo-driver/mongo"
  "go.mongodb.org/mongo-driver/mongo/options"
)

const mdbURL = "mongodb+srv://readonly:readonly@covid-19.hip2i.mongodb.net/covid19"
const earthRadius = 6371.0

// Metadata represents (a subset of) the data stored in the metadata
// collection in a single document.
type Metadata struct {
  LastDate time.Time `bson:"last_date"`
  // There are other fields in this document, but this sample code doesn't
  // use them.
}

// GlobalAndUS represents the document structure of documents in the
// 'global_and_us' collection.
type GlobalAndUS struct {
  ID  primitive.ObjectID `bson:"_id"`
  UID int32

  // Location:
  CombinedName string `bson:"combined_name"`
  County       string
  State        string
  Country      string
  CountryCode  int32  `bson:"country_code"`
  CountryISO2  string `bson:"country_iso2"`
  CountryISO3  string `bson:"country_iso3"`
  FIPS         int32
  Loc          struct {
      Type        string
      Coordinates []float64
  }

  Date time.Time

  // Statistics:
  Confirmed  int32
  Deaths     int32
  Population int32
  Recovered  int32
}

// main is the entrypoint for this binary.
// It connects to MongoDB but most of the interesting code is in other functions.
func main() {
  ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
  defer cancel()
  client, err := mongo.Connect(ctx, options.Client().ApplyURI(mdbURL))
  if err != nil {
      panic(fmt.Sprintf("Error initializing MongoDB Client: %v", err))
  }
  defer client.Disconnect(ctx)

  // Get references to the main collections:
  database := client.Database("covid19")
  global_and_us := database.Collection("global_and_us")
  metadata := database.Collection("metadata")

  // Print some interesting results:
  fmt.Println("\nMost recent 10 global_and_us for United Kingdom:")
  recentCountryStats(global_and_us, "United Kingdom")
  lastDate := mostRecentDateLoaded(metadata)
  fmt.Printf("\nLast date loaded: %v\n", lastDate)
  fmt.Println("\nThe last day's highest reported recoveries:")
  highestRecoveries(global_and_us, lastDate)
  fmt.Println("\nThe last day's confirmed cases for all the countries within 500km of Paris:")
  confirmedWithinRadius(global_and_us, lastDate, 2.341908, 48.860199, 500.0)
}

// recentCountryStats prints the most recent 10 stats for a country.
// Note that this won't work for "US" because that data is broken down by county & state.
func recentCountryStats(global_and_us *mongo.Collection, country string) {
  ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
  defer cancel()
  findOptions := options.Find().SetSort(bson.D{{"date", -1}}).SetLimit(10)
  cur, err := global_and_us.Find(ctx, bson.D{{"country", country}, {"state", nil}}, findOptions)
  if err != nil {
      panic(err)
  }
  defer cur.Close(ctx)
  adapter := func(s GlobalAndUS) []string {
      return []string{
          s.Date.String(),
          strconv.Itoa(int(s.Confirmed)),
          strconv.Itoa(int(s.Recovered)),
          strconv.Itoa(int(s.Deaths)),
      }
  }
  printTable(ctx, []string{"Date", "Confirmed", "Recovered", "Deaths"}, cur, adapter)
}

// mostRecentDateLoaded gets the date of the last data loaded into the database
// from the 'metadata' collection.
func mostRecentDateLoaded(metadata *mongo.Collection) time.Time {
  var meta Metadata
  ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
  defer cancel()
  if err := metadata.FindOne(ctx, bson.D{}).Decode(&meta); err != nil {
      panic(fmt.Sprintf("Error loading metadata document: %v", err))
  }
  return meta.LastDate
}

// highestRecoveries prints the top 5 countries with the most recoveries.
func highestRecoveries(global_and_us *mongo.Collection, date time.Time) {
  /// The last day's highest reported recoveries
  opts := options.Find().SetSort(bson.D{{"recovered", -1}}).SetLimit(5)
  ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
  defer cancel()
  cur, err := global_and_us.Find(ctx, bson.D{{"date", date}}, opts)
  if err != nil {
      panic(err)
  }
  defer cur.Close(ctx)
  adapter := func(s GlobalAndUS) []string {
      return []string{s.CombinedName, strconv.Itoa(int(s.Recovered))}
  }
  printTable(ctx, []string{"Country", "Recovered"}, cur, adapter)
}

// Confirmed cases for all countries within radius km of a lon/lat coordinate:
func confirmedWithinRadius(global_and_us *mongo.Collection, date time.Time, lon float64, lat float64, radius float64) {
  center := bson.A{lon, lat}
  locationExpr := bson.E{
      "loc", bson.D{{
          "$geoWithin", bson.D{{
              "$centerSphere", bson.A{center, radius / earthRadius},
          }},
      }},
  }
  ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
  defer cancel()
  cur, err := global_and_us.Find(ctx, bson.D{{"date", date}, locationExpr})
  if err != nil {
      panic(err)
  }
  defer cur.Close(ctx)
  adapter := func(s GlobalAndUS) []string {
      return []string{s.CombinedName, strconv.Itoa(int(s.Confirmed))}
  }
  printTable(ctx, []string{"Country", "Confirmed"}, cur, adapter)
}

// printTable prints the results of a global_and_us query in a table.
// headings provides the heading cell contents
// mapper is a function which maps GlobalAndUS structs to a string array of values to be displayed in the table.
func printTable(ctx context.Context, headings []string, cursor *mongo.Cursor, mapper func(GlobalAndUS) []string) {
  table := tablewriter.NewWriter(os.Stdout)
  table.SetHeader(headings)

  for cursor.Next(ctx) {
      var result GlobalAndUS
      err := cursor.Decode(&result)
      if err != nil {
          panic(err)
      }

      table.Append(mapper(result))
  }
  if err := cursor.Err(); err != nil {
      panic(err)
  }

  table.Render()
}
```

### Accessing the Data with Google Colaboratory

If you have a Google account, a great way to get started is with our [Google Colab Notebook](https://colab.research.google.com/drive/1M_wu0QqAWnml5_WWYSeMESuJp5pUjtx-).

The sample code shows how to install pymongo and use it to connect to the MongoDB COVID-19 dataset. There are some example queries which show how to query the data and display it in the notebook, and the last example demonstrates how to display a chart using Pandas & Matplotlib!

![How to render a chart in a Colab notebook](https://mongodb-devhub-cms.s3.us-west-1.amazonaws.com/notebook_screenshot_3972e76a85.png)

If you want to modify the notebook, you can take a copy by selecting "Save a copy in Drive ..." from the "File" menu, and then you'll be free to edit the copy.

### Accessing the Data with Business Intelligence Tools

You can get lots of value from the dataset without any programming at all. We've enabled the [Atlas BI Connector](https://docs.atlas.mongodb.com/bi-connection/), which exposes an SQL interface to MongoDB's document structure. This means you can use data analysis and dashboarding tools like [Tableau](https://www.tableau.com/support/releases/desktop/10.3), [Qlik Sense](https://www.qlik.com/us/products/qlik-sense), and even [MySQL Workbench](https://www.mysql.com/products/workbench/) to analyze, visualise and extract understanding from the data.

Here's an example of a visualisation produced in a few clicks with Tableau:

![COVID-19 World map in Tableau.](https://mongodb-devhub-cms.s3.us-west-1.amazonaws.com/map_tableau_59c86674ce.png)

Tableau is a powerful data visualisation and dashboard tool, and can be connected to our COVID-19 data in a few steps. We've written a [short tutorial](https://github.com/mongodb-developer/open-data-covid-19/blob/master/tableau/README.md) to get you up and running.

### Accessing the Data with any SQL tool

As mentioned above, the [Atlas BI Connector](https://docs.atlas.mongodb.com/bi-connection/) is activated so you can connect any SQL tool to this cluster using the following connection information:

-   Server: covid-19-biconnector.hip2i.mongodb.net,
-   Port: 27015,
-   Database: covid19 or covid19jhu (depends which version of the dataset you want to see),
-   Username: readonly or readonly?source=admin,
-   Password: readonly.

### Take a copy of the data

Accessing *our* copy of this data in a read-only database is useful, but it won't be enough if you want to integrate it with other data within a single MongoDB cluster. You can obtain a copy of the database, either to use offline using a different tool outside of MongoDB, or to load into your own MongoDB instance. `mongoexport` is a command-line tool that produces a [JSONL](http://jsonlines.org/) or CSV export of data stored in a MongoDB instance. First, follow these [instructions to install the MongoDB Database Tools](https://docs.mongodb.com/database-tools/mongoexport/#availability).

Now you can run the following in your console to download the metadata and global_and_us collections as jsonl files in your current directory:

``` bash
mongoexport --collection='global_and_us' --out='global_and_us.jsonl' --uri="mongodb+srv://readonly:readonly@covid-19.hip2i.mongodb.net/covid19"
mongoexport --collection='metadata' --out='metadata.jsonl' --uri="mongodb+srv://readonly:readonly@covid-19.hip2i.mongodb.net/covid19"
```

>
>
>Use the `--jsonArray` option if you prefer to work with a JSON array rather than a [JSONL](http://jsonlines.org/) file.
>
>

Documentation for all the features of `mongoexport` is available on the [MongoDB website](https://docs.mongodb.com/database-tools/mongoexport/) and with the command `mongoexport --help`.

Once you have the data on your computer, you can use it directly with local tools, or load it into your own MongoDB instance using [mongoimport](https://docs.mongodb.com/database-tools/mongoimport/).

``` bash
mongoimport --collection='global_and_us' --uri="mongodb+srv://<user>:<password>@<your-cluster>.mongodb.net/covid19" global_and_us.jsonl
mongoimport --collection='metadata' --uri="mongodb+srv://<user>:<password>@<your-cluster>.mongodb.net/covid19" metadata.jsonl
```

>
>
>Note that you cannot run these commands against our cluster because the user we gave you (`readonly:readonly`) doesn't have write permission on this cluster.
>
>Read our [Getting Your Free MongoDB Atlas Cluster blog post](/quickstart/free-atlas-cluster) if you want to know more.
>
>

Another smart way to duplicate the dataset in your own cluster would be to use `mongodump` and `mongorestore`. Apart from being more efficient, it will also grab the indexes definition along with the data.

``` bash
mongodump --uri="mongodb+srv://readonly:readonly@covid-19.hip2i.mongodb.net/covid19"
mongorestore --drop --uri="<YOUR_URI>"
```

## Wrap up

We see the value and importance of making this data as readily available to everyone as possible, so we're not stopping here. Over the coming days, we'll be adding a GraphQL and REST API, as well as making the data available within Excel and Google Sheets.

We've also launched an [Atlas credits program](https://www.mongodb.com/blog/post/helping-developers-tackle-covid19) for anyone working on detecting, understanding, and stopping the spread of COVID-19.

If you are having any problems accessing the data or have other data sets you would like to host please contact us on [the MongoDB community](https://community.mongodb.com/). We would also love to showcase any services you build on top of this data set. Finally please send in PRs for any code changes you would like to make to the examples.

You can also reach out to the authors directly ([Aaron Bassett](https://twitter.com/aaronbassett), [Joe Karlsson](https://twitter.com/JoeKarlsson1), [Mark Smith](https://twitter.com/judy2k), and [Maxime Beugnet](https://twitter.com/MBeugnet)) on Twitter.

## Sources

-   [MongoDB Open Data COVID-19 Github repository](https://github.com/mongodb-developer/open-data-covid-19)
-   [JHU Dataset on Github repository](https://github.com/CSSEGISandData/COVID-19)
