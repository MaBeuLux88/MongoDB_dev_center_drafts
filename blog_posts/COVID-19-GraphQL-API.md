## TL;DR

You can retrieve an access token using the API like so:

``` bash
curl -X POST 'https://realm.mongodb.com/api/client/v2.0/app/covid-19-qppza/auth/providers/anon-user/login'
```

Then you can read the [GraphQL API documentation](https://covid-19-qppza.mongodbstitch.com/) and start running queries
like this one using the access token you just retrieved:

``` bash
curl 'https://realm.mongodb.com/api/client/v2.0/app/covid-19-qppza/graphql' \
     --header 'Authorization: Bearer ACCESS_TOKEN' \
     --header 'Content-Type: application/json' \
     --data-raw '{"query":"query {countries_summary {_id combined_names confirmed country country_codes country_iso2s country_iso3s date deaths population recovered states uids}}"}'
```

## News

### November 16th, 2023

- [John Hopkins University (JHU)](https://coronavirus.jhu.edu/map.html) has stopped collecting data as of March 10th, 2023.
- Here is JHU's [GitHub repository](https://github.com/CSSEGISandData/COVID-19).
- First data entry is 2020-01-22, last one is 2023-03-09.
- Hosting the GraphQL API honestly isn't very valuable now as the data isn't updated anymore and the entire cluster is
  available below.
- Adding support for 3 new computed fields (in the relevant collections) that were not in the schemas previously:
    - confirmed_daily
    - deaths_daily
    - recovered_daily

## Introduction

Recently, we built the [MongoDB COVID-19 Open Data project](https://www.mongodb.com/developer/products/atlas/johns-hopkins-university-covid-19-data-atlas/) using
the [dataset from Johns Hopkins University](https://github.com/CSSEGISandData/COVID-19/) (JHU).

It's a great dataset for education purposes and for pet projects. The MongoDB Atlas cluster is freely accessible using
the user `readonly` and the password `readonly` using the connection string:

``` none
mongodb+srv://readonly:readonly@covid-19.hip2i.mongodb.net/covid19
```

> Learn about the databases and collection in [the dedicated blog post](https://www.mongodb.com/developer/products/atlas/johns-hopkins-university-covid-19-data-atlas/).

You can use this cluster to build your application, but I also set up a GraphQL API
using [MongoDB App Services](https://www.mongodb.com/products/platform/atlas-app-services) to expose this data for you.

In this blog post, I will first show you how to access our GraphQL endpoint securely. Then we will have a look at the
documentation together to build out a variety of GraphQL queries to access all sorts of information in our dataset - all
against a single API endpoint. Learning how to use filters and request only specific fields in our data will help
optimize the performance of your applications - by bringing you exactly the data you want - nothing more, nothing less.

<figure align="center">
    <img
        style="border-radius: 10px; width: 60%"
        src="https://mongodb-devhub-cms.s3.us-west-1.amazonaws.com/old_images/article/johns-hopkins-university-covid-19-graphql-api/trevor-wow.gif"
        alt="Trevor Noah saying wow gif"
    />
</figure>

## Prerequisites

- Command line and [cURL](https://en.wikipedia.org/wiki/CURL) - which I'm using here for the sake of simplicity.
- Or any other tool which handles HTTP queries. I also tested to run the following queries
  with [Postman](https://www.postman.com/), and it works great.

## COVID-19 GraphQL API

### Get an Access Token

I used [MongoDB App Services](https://www.mongodb.com/docs/atlas/app-services/) to create this [GraphQL](https://graphql.org/) API. Since MongoDB
App Services is secure by default, only authenticated queries can be made. Yet since I want to keep this service as open as
possible, I simply used the [Anonymous Authentication](https://www.mongodb.com/docs/atlas/app-services/authentication/anonymous/) offered
by MongoDB App Services.

So now, all you need to retrieve an access token is
the [Application ID](https://www.mongodb.com/docs/atlas/app-services/apps/metadata/#find-your-app-id) — or `APP_ID`, for
short — of my MongoDB App Services application:

``` none
covid-19-qppza
```

And [the API to authenticate HTTP client request](https://www.mongodb.com/docs/atlas/app-services/data-api/authenticate/),
which is:

``` bash
curl -X POST 'https://realm.mongodb.com/api/client/v2.0/app/<APP_ID>/auth/providers/anon-user/login'
```

Inserting the `APP_ID` into the URL gives you:

``` bash
curl -X POST 'https://realm.mongodb.com/api/client/v2.0/app/covid-19-qppza/auth/providers/anon-user/login'
```

If you execute this query in your favorite shell, you will receive a JSON answer that looks like this one:

``` json
{
  "access_token":"eyJhbG......6dbnY",
  "refresh_token":"eyJhbG......uKpoM",
  "user_id":"5f692c44033b9e7f1554d475",
  "device_id":"000000000000000000000000"
}
```

Access tokens expire 30 minutes after MongoDB App Services grants them. When an access token expires, you can request a new one
using the same API, or you
can [get a new one using the refresh token](https://www.mongodb.com/docs/atlas/app-services/data-api/authenticate/#refresh-a-client-api-access-token).
Although it's often just easier to request a new one.

### Query the GraphQL API

Once you have the token, you can start browsing
the [GraphQL API documentation](https://covid-19-qppza.mongodbstitch.com/) that I generated
with [GraphDoc](https://github.com/2fd/graphdoc#readme) and build your first query.

Five collections are available in this GraphQL API, and you can learn more about each one of
them [in our documentation](https://github.com/mongodb-developer/open-data-covid-19#databases-and-collections). Each
have a "singular" query which can be used to retrieve a single document and a "plural" one to retrieve a list of
documents. As an exception, the metadata collection contains only a single document, so it offers no "plural" query.

You can see all the possible queries
in [the "query" page in the documentation](https://covid-19-qppza.mongodbstitch.com/query.doc.html), but I have also
summarized them in the following table:

##### GraphQL API

<table style="
        border: 1px solid #B8C4C2;
        border-collapse: collapse;
        margin: 16px 0;
        table-layout: fixed;
">
    <thead style="border: inherit" valign="bottom">
        <tr style="border: inherit">
            <th style="width: 250px; border: inherit; padding: 10px">Collection</th>
            <th style="width: 250px; border: inherit; padding: 10px">Query (singular / plural)</th>
            <th style="width: 250px; border: inherit; padding: 10px">Fields available</th>
        </tr>
    </thead>
    <tbody style="border: inherit" valign="top">
        <tr style="border: inherit">
            <td style="border: inherit; padding: 10px">
                <a href="https://github.com/mongodb-developer/open-data-covid-19#collection-metadata">metadata</a>
            </td>
            <td style="border: inherit; padding: 10px">
                <ul>
                    <li>metadatum</li>
                </ul>
            </td>
            <td style="border: inherit; padding: 10px">
                <ul>
                  <li>_id: String</li>
                  <li>counties: [String]</li>
                  <li>countries: [String]</li>
                  <li>first_date: DateTime</li>
                  <li>iso3s: [String]</li>
                  <li>last_date: DateTime</li>
                  <li>states: [String]</li>
                  <li>states_us: [String]</li>
                  <li>uids: [Int]</li>
                </ul>
            </td>
        </tr>
        <tr style="border: inherit">
            <td style="border: inherit; padding: 10px">
                <a href="https://github.com/mongodb-developer/open-data-covid-19#collection-countries_summary">countries_summary</a>
            </td>
            <td style="border: inherit; padding: 10px">
                <ul>
                    <li>countries_summary</li>
                    <li>countries_summarys</li>
                </ul>
            </td>
            <td style="border: inherit; padding: 10px">
                <ul>
                  <li>_id: ObjectId</li>
                  <li>combined_names: [String]</li>
                  <li>confirmed: Int</li>
                  <li>confirmed_daily: Int</li>
                  <li>country: String</li>
                  <li>country_codes: [Int]</li>
                  <li>country_iso2s: [String]</li>
                  <li>country_iso3s: [String]</li>
                  <li>date: DateTime</li>
                  <li>deaths: Int</li>
                  <li>deaths_daily: Int</li>
                  <li>population: Int</li>
                  <li>recovered: Int</li>
                  <li>recovered_daily: Int</li>
                  <li>states: [String]</li>
                  <li>uids: [Int]</li>
               </ul>
            </td>
        </tr>
        <tr style="border: inherit">
            <td style="border: inherit; padding: 10px">
                <a href="https://github.com/mongodb-developer/open-data-covid-19#collection-global">global</a>
            </td>
            <td style="border: inherit; padding: 10px">
                <ul>
                    <li>global</li>
                    <li>globals</li>
                </ul>
            </td>
            <td style="border: inherit; padding: 10px">
                <ul>
                  <li>_id: ObjectId</li>
                  <li>combined_name: String</li>
                  <li>confirmed: Int</li>
                  <li>confirmed_daily: Int</li>
                  <li>country: String</li>
                  <li>country_code: Int</li>
                  <li>country_iso2: String</li>
                  <li>country_iso3: String</li>
                  <li>date: DateTime</li>
                  <li>deaths: Int</li>
                  <li>deaths_daily: Int</li>
                  <li>loc: GlobalLoc</li>
                  <li>population: Int</li>
                  <li>recovered: Int</li>
                  <li>recovered_daily: Int</li>
                  <li>state: String</li>
                  <li>uid: Int</li>
               </ul>
            </td>
        </tr>
        <tr style="border: inherit">
            <td style="border: inherit; padding: 10px">
                <a href="https://github.com/mongodb-developer/open-data-covid-19#collection-global_and_us">global_and_us</a>
            </td>
            <td style="border: inherit; padding: 10px">
                <ul>
                    <li>global_and_u</li>
                    <li>global_and_us</li>
                </ul>
            </td>
            <td style="border: inherit; padding: 10px">
                <ul>
                  <li>_id: ObjectId</li>
                  <li>combined_name: String</li>
                  <li>confirmed: Int</li>
                  <li>confirmed_daily: Int</li>
                  <li>country: String</li>
                  <li>country_code: Int</li>
                  <li>country_iso2: String</li>
                  <li>country_iso3: String</li>
                  <li>county: String</li>
                  <li>date: DateTime</li>
                  <li>deaths: Int</li>
                  <li>deaths_daily: Int</li>
                  <li>fips: Int</li>
                  <li>loc: Global_and_uLoc</li>
                  <li>population: Int</li>
                  <li>recovered: Int</li>
                  <li>recovered_daily: Int</li>
                  <li>state: String</li>
                  <li>uid: Int</li>
               </ul>
            </td>
        </tr>
       <tr style="border: inherit">
            <td style="border: inherit; padding: 10px">
                <a href="https://github.com/mongodb-developer/open-data-covid-19#collection-us_only">us_only</a>
            </td>
            <td style="border: inherit; padding: 10px">
                <ul>
                    <li>us_only</li>
                    <li>us_onlys</li>
                </ul>
            </td>
            <td style="border: inherit; padding: 10px">
                <ul>
                  <li>_id: ObjectId</li>
                  <li>combined_name: String</li>
                  <li>confirmed: Int</li>
                  <li>confirmed_daily: Int</li>
                  <li>country: String</li>
                  <li>country_code: Int</li>
                  <li>country_iso2: String</li>
                  <li>country_iso3: String</li>
                  <li>county: String</li>
                  <li>date: DateTime</li>
                  <li>deaths: Int</li>
                  <li>deaths_daily: Int</li>
                  <li>fips: Int</li>
                  <li>loc: Us_onlyLoc</li>
                  <li>population: Int</li>
                  <li>state: String</li>
                  <li>uid: Int</li>
               </ul>
            </td>
        </tr>
    </tbody>
</table>

> Find all the details in the [GraphQL documentation](https://covid-19-qppza.mongodbstitch.com/query.doc.html). To
> explore this data and the flexibility of GraphQL, let's build out three example queries.

#### Query 1. The Metadata Collection

Let's first query
the [metadata collection](https://github.com/mongodb-developer/open-data-covid-19#collection-metadata). This collection
contains only one single document listing all the values (obtained with mongodb distinct function) for the major fields.

Here is the GraphQL query:

``` javascript
query {
  metadatum {
    _id
    countries
    states
    states_us
    counties
    iso3s
    uids
    first_date
    last_date
  }
}
```

Now let's build an HTTP query with it. Don't forget to replace the `ACCESS_TOKEN` in the query with your own valid
token.

``` bash
curl 'https://realm.mongodb.com/api/client/v2.0/app/covid-19-qppza/graphql' \
     --header 'Authorization: Bearer ACCESS_TOKEN' \
     --header 'Content-Type: application/json' \
     --data-raw '{"query": "query { metadatum { _id countries states states_us counties iso3s uids first_date last_date } }" }'
```

This will answer a [JSON document](https://covid-19-qppza.mongodbstitch.com/metadatum.doc.html) which will help you
populate your filters for the other queries:

``` json
{"data":
  {"metadatum":
    {
      "_id":"metadata",
      "countries": [ "Afghanistan", "Albania", "Algeria","..."],
      "states":["Alabama","Alaska","Alberta","American Samoa","..."],
      "states_us":["Alabama","Alaska","American Samoa","..."],
      "counties":["Abbeville","Acadia","Accomack","..."],
      "iso3s":["ABW","AFG","AGO","..."],
      "uids":[4,8,12,16,...],
      "first_date":"2020-01-22T00:00:00Z",
      "last_date":"2020-09-23T00:00:00Z"
    }
  }
}
```

#### Query 2. The `countries_summary` Collection

Now let's refine our data query even further. We want to see how France is trending for the last week, so we will use a
query filter:

``` javascript
{country: "France", date_gte: "2020-09-16T00:00:00Z"}
```

Plus we will sort the dates in descending order with the most recent dates first. Remember with GraphQL, we can request
as many or as few data fields as we want for the client. In this example, we'll only ask for the number of confirmed
cases, deaths, and recoveries, along with the date. The final query with this filter and those specific fields is:

``` javascript
query {
  countries_summarys(query: {country: "France", date_gte: "2020-09-16T00:00:00Z"}, sortBy: DATE_DESC) {
    confirmed
    date
    deaths
    recovered
  }
}
```

Or with cURL:

``` bash
curl 'https://realm.mongodb.com/api/client/v2.0/app/covid-19-qppza/graphql' \
     --header 'Authorization: Bearer ACCESS_TOKEN' \
     --header 'Content-Type: application/json' \
     --data-raw '{"query": "query { countries_summarys(query: {country: \"France\", date_gte: \"2020-09-16T00:00:00Z\"}, sortBy: DATE_DESC) { confirmed date deaths recovered } }" }'
```

Which gives me:

``` json
{
    "data": {
        "countries_summarys": [
            {
                "confirmed": 507150,
                "date": "2020-09-22T00:00:00Z",
                "deaths": 31426,
                "recovered": 94961
            },
            {
                "confirmed": 496851,
                "date": "2020-09-21T00:00:00Z",
                "deaths": 31346,
                "recovered": 94289
            },
            {
                "confirmed": 467614,
                "date": "2020-09-20T00:00:00Z",
                "deaths": 31257,
                "recovered": 93586
            },
            {
                "confirmed": 467614,
                "date": "2020-09-19T00:00:00Z",
                "deaths": 31257,
                "recovered": 93586
            },
            {
                "confirmed": 467421,
                "date": "2020-09-18T00:00:00Z",
                "deaths": 31257,
                "recovered": 92700
            },
            {
                "confirmed": 454266,
                "date": "2020-09-17T00:00:00Z",
                "deaths": 31103,
                "recovered": 91765
            },
            {
                "confirmed": 443869,
                "date": "2020-09-16T00:00:00Z",
                "deaths": 31056,
                "recovered": 91293
            }
        ]
    }
}
```

#### Query 3. The `global_and_us` Collection

Finally, let's find the three counties in the USA with the greatest number of confirmed cases:

``` javascript
query {
  global_and_us(query: {country: "US", date: "2020-09-22T00:00:00Z"}, sortBy: CONFIRMED_DESC, limit: 3) {
    confirmed
    deaths
    state
    county
  }
}
```

Or with cURL:

``` bash
curl 'https://realm.mongodb.com/api/client/v2.0/app/covid-19-qppza/graphql' \
     --header 'Authorization: Bearer ACCESS_TOKEN' \
     --header 'Content-Type: application/json' \
     --data-raw '{"query": "query { global_and_us(query: {country: \"US\", date: \"2020-09-22T00:00:00Z\"}, sortBy: CONFIRMED_DESC, limit: 3) { confirmed deaths state county } }" }'
```

Results:

``` json
{
  "data": {
    "global_and_us": [
      {
        "confirmed": 262133,
        "county": "Los Angeles",
        "deaths": 6401,
        "state": "California"
      },
      {
        "confirmed": 167515,
        "county": "Miami-Dade",
        "deaths": 3085,
        "state": "Florida"
      },
      {
        "confirmed": 140314,
        "county": "Maricopa",
        "deaths": 3275,
        "state": "Arizona"
      }
    ]
  }
}
```

## But How Did I Build This GraphQL API?

Simple and easy, I used the [MongoDB Atlas GraphQL API](https://www.mongodb.com/docs/atlas/app-services/graphql/) which just took me a
few clicks.

If you want to build this very same service using this dataset, check
out [our blog](https://www.mongodb.com/developer/products/atlas/johns-hopkins-university-covid-19-data-atlas/) which explains the dataset's content and how you
can grab it. Then, have a look at Nic's [blog post](https://www.mongodb.com/developer/products/atlas/graphql-support-atlas-stitch/) which explains how to set up a
GraphQL API using MongoDB App Services.

You want to improve your knowledge even more around MongoDB and GraphQL? Then you must read the blog
post [GraphQL: The Easy Way to Do the Hard Stuff](https://www.mongodb.com/developer/products/realm/graphql-easy/) from Karen and Brian.

## Wrap-Up

MongoDB made setting up a GraphQL API really easy. And this GraphQL API made querying our Covid19 dataset to gain
insight even easier. We update this data every hour (not anymore, see News section), and we hope you will enjoy using this data to explore and learn.

> Are you trying to help solve this pandemic in any way? Remember that if you are trying to build an application that
> helps to detect, understand, or stop the spread of the COVID-19 virus, we have
> a [FREE MongoDB Atlas credit program](https://www.mongodb.com/blog/post/helping-developers-tackle-covid19) that can help
> you scale and hopefully solve this global pandemic.

I truly hope you will be able to build something amazing with this GraphQL API. Even if it won't save the world from the
COVID-19 pandemic, I hope it will be a great source of motivation and training for your next pet project.

[Send me a tweet](https://twitter.com/MBeugnet) or ping me in
our [Community Forum](https://developer.mongodb.com/community/forums/) with your project using this API. I will
definitely check it out!
