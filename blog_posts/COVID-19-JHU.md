## TL;DR

Our MongoDB Cluster is running in version 7.0.3.

You can connect to it using MongoDB Compass, the Mongo Shell, SQL or any MongoDB driver supporting at least MongoDB 7.0
with the following URI:

``` none
mongodb+srv://readonly:readonly@covid-19.hip2i.mongodb.net/covid19
```

> `readonly` is the username and the password, they are not meant to be replaced.

## News

### November 15th, 2023

- [John Hopkins University (JHU)](https://coronavirus.jhu.edu/map.html) has stopped collecting data as of March 10th, 2023.
- Here is JHU's [GitHub repository](https://github.com/CSSEGISandData/COVID-19).
- First data entry is 2020-01-22, last one is 2023-03-09.
- Cluster now running on 7.0.3
- Removed the database `covid19jhu` with the raw data. Use the much better database `covid19`.
- BI Tools access is now disable.

### December 10th, 2020

- Upgraded the cluster to 4.4.
- Improved the python data import script to calculate the daily values using the existing cumulative values with
  an [Aggregation Pipeline](https://docs.mongodb.com/manual/core/aggregation-pipeline/).
    - confirmed_daily.
    - deaths_daily.
    - recovered_daily.

### May 13th, 2020

- Renamed the field "city" to "county" and "cities" to "counties" where appropriate. They contain the data from the
  column "Admin2" in JHU CSVs.

### May 6th, 2020

- The `covid19` database now has 5 collections. More details in
  our [README.md](https://github.com/mongodb-developer/open-data-covid-19/blob/master/README.md).
- The `covid19.statistics` collection is renamed `covid19.global_and_us` for more clarity.
- [Maxime's Charts](https://www.mongodb.com/developer/products/atlas/coronavirus-map-live-data-tracker-charts/) are now
  using the `covid19.global_and_us` collection.
- The dataset is updated hourly so any commit done by JHU will be reflected at most one hour later in our cluster.

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

As the COVID-19 pandemic has swept the globe, the work of [JHU (Johns Hopkins University)](https://www.jhu.edu/) and
its [COVID-19 dashboard](https://coronavirus.jhu.edu/map.html) has become vitally important in keeping people informed
about the progress of the virus in their communities, in their countries, and in the world.

JHU not only publishes their dashboard,
but [they make the data powering it freely available for anyone to use](https://github.com/CSSEGISandData/COVID-19).
However, their data is delivered as flat CSV files which you need to download each time to then query. We've set out to
make that up-to-date data more accessible so people could build other analyses and applications directly on top of the
data set.

We are now hosting a service with a frequently updated copy of the JHU data in MongoDB Atlas, our database in the cloud.
This data is free for anyone to query using the MongoDB Query language and/or SQL. We also support
a [variety of BI tools directly](https://docs.atlas.mongodb.com/bi-connection/), so you can query the data with Tableau,
Qlik and Excel.

With the MongoDB COVID-19 dataset there will be no more manual downloads and no more frequent format changes. With this
data set, this service will deliver a consistent JSON and SQL view every day with no
downstream [ETL](https://www.webopedia.com/TERM/E/ETL.html) required.

None of the actual data is modified. It is simply structured to make it easier to query by placing it within
a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster and by creating some convenient APIs.

## The MongoDB Dataset

All the data we use to create the MongoDB COVID-19 dataset comes from the [JHU](https://www.jhu.edu/) dataset. In their
turn, here are the sources they are using:

- the World Health Organization,
- the National Health Commission of the People's Republic of China,
- the United States Centre for Disease Control,
- the Australia Government Department of Health,
- the European Centre for Disease Prevention and Control,
- and many others.

You can read the [full list on their GitHub repository](https://github.com/CSSEGISandData/COVID-19).

Using the CSV files they provide, we are producing two different databases in our cluster.

- `covid19jhu` contains the raw CSV files imported with
  the [mongoimport](https://docs.mongodb.com/manual/reference/program/mongoimport/) tool,
- `covid19` contains the same dataset but with a clean MongoDB schema design with all the good practices we are
  recommending.

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

The document above was obtained by joining together the file `UID_ISO_FIPS_LookUp_Table.csv` and the CSV files time
series you can find
in [this folder](https://github.com/CSSEGISandData/COVID-19/tree/master/csse_covid_19_data/csse_covid_19_time_series).

Some fields might not exist in all the documents because they are not relevant or are just not provided
by [JHU](https://www.jhu.edu/). If you want more details, run a schema analysis
with [MongoDB Compass](https://www.mongodb.com/products/compass) on the different collections available.

If you prefer to host the data yourself, the scripts required to download and transform the JHU data are
open-source. You
can [view them and instructions for how to use them on our GitHub repository](https://github.com/mongodb-developer/open-data-covid-19/tree/master/data-import).

In the `covid19` database, you will find 5 collections which are detailed in
our [GitHub repository README.md file](https://github.com/mongodb-developer/open-data-covid-19/blob/master/README.md).

- metadata
- global (the data from the time series global files)
- us_only (the data from the time series US files)
- global_and_us (the most complete one)
- countries_summary (same as global but countries are grouped in a single doc for each date)

## Get Started

You can begin exploring the data right away without any MongoDB or programming experience
using [MongoDB Charts](https://www.mongodb.com/products/charts)
or [MongoDB Compass](https://www.mongodb.com/products/compass).

In the following sections, we will also show you how to consume this dataset using the Java, Node.js and Python drivers.

We will show you how to perform the following queries in each language:

- Retrieve the last 5 days of data for a given place,
- Retrieve all the data for the last day,
- Make a geospatial query to retrieve data within a certain distance of a given place.

### Explore the Dataset with MongoDB Charts

With [Charts](https://www.mongodb.com/products/charts), you can create visualisations of the data using any of the
pre-built graphs and charts. You can
then [arrange this into a unique dashboard](https://charts.mongodb.com/charts-open-data-covid-19-zddgb/public/dashboards/60da4f45-f168-434a-82f6-d37ce88ff9ea),
or embed the charts in your pages or blogs.

:charts[]{url=https://charts.mongodb.com/charts-open-data-covid-19-zddgb id=60da4f45-f168-4266-8264-d37ce88ff9fa
theme=light autorefresh=3600}

> If you want to create your own MongoDB Charts dashboard, you will need to set up your
> own [Free MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster and import the dataset in your cluster using
> the [import scripts](https://github.com/mongodb-developer/open-data-covid-19/tree/master/data-import) or
> use `mongoexport & mongoimport` or `mongodump & mongorestore`. See this section for more
> details: [Take a copy of the data](#take-a-copy-of-the-data).

### Explore the Dataset with MongoDB Compass

[Compass](https://www.mongodb.com/products/compass) allows you to dig deeper into the data using
the [MongoDB Query Language](https://docs.mongodb.com/manual/tutorial/query-documents/) or via
the [Aggregation Pipeline](https://docs.mongodb.com/manual/core/aggregation-pipeline/) visual editor. Perform a range of
operations on the
data, [including mathematical, comparison and groupings](https://docs.mongodb.com/manual/meta/aggregation-quick-reference/#operator-expressions).
Create documents that provide unique insights and interpretations. You can use the output from your pipelines
as [data-sources for your Charts](https://docs.mongodb.com/charts/saas/data-sources/).

![Screencast showing some of the features of MongoDB Compass for exploring COVID-19 Data](https://mongodb-devhub-cms.s3.us-west-1.amazonaws.com/compass_covid19_screencast_386b271cce.gif)

For MongoDB Compass or your driver, you can use this connection string.

``` 
mongodb+srv://readonly:readonly@covid-19.hip2i.mongodb.net/covid19
```

### Explore the Dataset with the MongoDB Shell

Because we store the data in MongoDB, you can also access it via
the [MongoDB Shell](https://www.mongodb.com/docs/mongodb-shell/) or
using [any of our drivers](https://docs.mongodb.com/drivers/). We've limited access to these collections to 'read-only'.
You can find the connection strings for the shell and Compass below, as well as driver examples
for [Java](https://docs.mongodb.com/drivers/java/), [Node.js](https://docs.mongodb.com/drivers/node/),
and [Python](https://docs.mongodb.com/drivers/python/) to get you started.

``` shell
mongo "mongodb+srv://covid-19.hip2i.mongodb.net/covid19"  --username readonly --password readonly
```

### Accessing the Data with Java

Our Java examples are available in
our [Github Repository Java folder](https://github.com/mongodb-developer/open-data-covid-19/tree/master/java).

You need the three POJOs from
the [Java Github folder](https://github.com/mongodb-developer/open-data-covid-19/tree/master/java/mongodb-driver/src/main/java/com/mongodb/coronavirus)
to make this work.

### Accessing the Data with Node.js

Our Node.js examples are available in
our [Github Repository Node.js folder](https://github.com/mongodb-developer/open-data-covid-19/tree/master/nodejs).

### Accessing the Data with Python

Our Python examples are available in
our [Github Repository Python folder](https://github.com/mongodb-developer/open-data-covid-19/tree/master/python).

### Accessing the Data with Golang

Our Golang examples are available in
our [Github Repository Golang folder](https://github.com/mongodb-developer/open-data-covid-19/tree/master/golang).

### Accessing the Data with Google Colaboratory

If you have a Google account, a great way to get started is with
our [Google Colab Notebook](https://colab.research.google.com/drive/1M_wu0QqAWnml5_WWYSeMESuJp5pUjtx-).

The sample code shows how to install pymongo and use it to connect to the MongoDB COVID-19 dataset. There are some
example queries which show how to query the data and display it in the notebook, and the last example demonstrates how
to display a chart using Pandas & Matplotlib!

![How to render a chart in a Colab notebook](https://mongodb-devhub-cms.s3.us-west-1.amazonaws.com/notebook_screenshot_3972e76a85.png)

If you want to modify the notebook, you can take a copy by selecting "Save a copy in Drive ..." from the "File" menu,
and then you'll be free to edit the copy.

### Accessing the Data with Business Intelligence Tools

You can get lots of value from the dataset without any programming at all. We've enabled
the [Atlas BI Connector](https://docs.atlas.mongodb.com/bi-connection/) (not anymore, see News section), which exposes
an SQL interface to MongoDB's document structure. This means you can use data analysis and dashboarding tools
like [Tableau](https://www.tableau.com/support/releases/desktop/10.3), [Qlik Sense](https://www.qlik.com/us/products/qlik-sense),
and even [MySQL Workbench](https://www.mysql.com/products/workbench/) to analyze, visualise and extract understanding
from the data.

Here's an example of a visualisation produced in a few clicks with Tableau:

![COVID-19 World map in Tableau.](https://mongodb-devhub-cms.s3.us-west-1.amazonaws.com/map_tableau_59c86674ce.png)

Tableau is a powerful data visualisation and dashboard tool, and can be connected to our COVID-19 data in a few steps.
We've written a [short tutorial](https://github.com/mongodb-developer/open-data-covid-19/blob/master/tableau/README.md)
to get you up and running.

### Accessing the Data with any SQL tool

As mentioned above, the [Atlas BI Connector](https://docs.atlas.mongodb.com/bi-connection/) is activated (not anymore, see News section), so you can
connect any SQL tool to this cluster using the following connection information:

- Server: covid-19-biconnector.hip2i.mongodb.net,
- Port: 27015,
- Database: covid19,
- Username: readonly or readonly?source=admin,
- Password: readonly.

### Take a copy of the data

Accessing *our* copy of this data in a read-only database is useful, but it won't be enough if you want to integrate it
with other data within a single MongoDB cluster. You can obtain a copy of the database, either to use offline using a
different tool outside of MongoDB, or to load into your own MongoDB instance. `mongoexport` is a command-line tool that
produces a [JSONL](http://jsonlines.org/) or CSV export of data stored in a MongoDB instance. First, follow
these [instructions to install the MongoDB Database Tools](https://docs.mongodb.com/database-tools/mongoexport/#availability).

Now you can run the following in your console to download the metadata and global_and_us collections as jsonl files in
your current directory:

``` bash
mongoexport --collection='global_and_us' --out='global_and_us.jsonl' --uri="mongodb+srv://readonly:readonly@covid-19.hip2i.mongodb.net/covid19"
mongoexport --collection='metadata' --out='metadata.jsonl' --uri="mongodb+srv://readonly:readonly@covid-19.hip2i.mongodb.net/covid19"
```

> Use the `--jsonArray` option if you prefer to work with a JSON array rather than a [JSONL](http://jsonlines.org/) file.

Documentation for all the features of `mongoexport` is available on
the [MongoDB website](https://docs.mongodb.com/database-tools/mongoexport/) and with the command `mongoexport --help`.

Once you have the data on your computer, you can use it directly with local tools, or load it into your own MongoDB
instance using [mongoimport](https://docs.mongodb.com/database-tools/mongoimport/).

``` bash
mongoimport --collection='global_and_us' --uri="mongodb+srv://<user>:<password>@<your-cluster>.mongodb.net/covid19" global_and_us.jsonl
mongoimport --collection='metadata' --uri="mongodb+srv://<user>:<password>@<your-cluster>.mongodb.net/covid19" metadata.jsonl
```

> Note that you cannot run these commands against our cluster because the user we gave you (`readonly:readonly`) doesn't
> have write permission on this cluster.
> Read our [Getting Your Free MongoDB Atlas Cluster blog post](/quickstart/free-atlas-cluster) if you want to know more.

Another smart way to duplicate the dataset in your own cluster would be to use `mongodump` and `mongorestore`. Apart
from being more efficient, it will also grab the indexes definition along with the data.

``` bash
mongodump --uri="mongodb+srv://readonly:readonly@covid-19.hip2i.mongodb.net/covid19"
mongorestore --drop --uri="<YOUR_URI>"
```

## Wrap up

We see the value and importance of making this data as readily available to everyone as possible, so we're not stopping
here. Over the coming days, we'll be adding a GraphQL and REST API, as well as making the data available within Excel
and Google Sheets.

We've also launched an [Atlas credits program](https://www.mongodb.com/blog/post/helping-developers-tackle-covid19) for
anyone working on detecting, understanding, and stopping the spread of COVID-19.

If you are having any problems accessing the data or have other data sets you would like to host please contact us
on [the MongoDB community](https://www.mongodb.com/community/). We would also love to showcase any services you build on top
of this data set. Finally please send in PRs for any code changes you would like to make to the examples.

You can also reach out to the authors
directly ([Aaron Bassett](https://twitter.com/aaronbassett), [Joe Karlsson](https://twitter.com/JoeKarlsson1), [Mark Smith](https://twitter.com/judy2k),
and [Maxime Beugnet](https://twitter.com/MBeugnet)) on Twitter.

## Sources

- [MongoDB Open Data COVID-19 GitHub repository](https://github.com/mongodb-developer/open-data-covid-19)
- [JHU Dataset on GitHub repository](https://github.com/CSSEGISandData/COVID-19)
