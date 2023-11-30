## TL;DR

> Here is the [REST API Documentation in Postman](https://documenter.getpostman.com/view/1678623/SzfDx54T?version=latest).

## News

### November 15th, 2023

- [John Hopkins University (JHU)](https://coronavirus.jhu.edu/map.html) has stopped collecting data as of March 10th, 2023.
- Here is JHU's [GitHub repository](https://github.com/CSSEGISandData/COVID-19).
- First data entry is 2020-01-22, last one is 2023-03-09.
- Current REST API is implemented using [Third-Party Services which is now deprecated](https://www.mongodb.com/docs/atlas/app-services/reference/services/).
- Hosting the REST API honestly isn't very valuable now as the data isn't updated anymore and the entire cluster is available below.
- The REST API will be removed on November 1st, 2024; but possibly earlier as it's currently mostly being queried for dates after the last entry.

### December 10th, 2020

- Added 3 new calculated fields:
  - confirmed_daily.
  - deaths_daily.
  - recovered_daily.

### September 10th, 2020

- Let me know what you think in [our topic in the community forum](https://developer.mongodb.com/community/forums/t/devhub-a-free-rest-api-for-johns-hopkins-university-covid-19-dataset/8915).
- Fixed a bug in my code which was failing if the IP address wasn't collected properly.

## Introduction

Recently, we built the [MongoDB COVID-19 Open Data project](/article/johns-hopkins-university-covid-19-data-atlas) using the [dataset from Johns Hopkins University](https://github.com/CSSEGISandData/COVID-19/) (JHU).

There are two big advantages to using this cluster, rather than directly using JHU's CSV files:

- It's updated automatically every hour so any update in JHU's repo will be there after a maximum of one hour.
- You don't need to clean, parse and transform the CSV files, our script does this for you!

The MongoDB Atlas cluster is freely accessible using the user `readonly` and the password `readonly` using the connection string:

```none
mongodb+srv://readonly:readonly@covid-19.hip2i.mongodb.net/covid19
```

You can use this cluster to build your application, but what about having a nice and free REST API to access this curated dataset?!

## COVID-19 REST API

> Here is the [REST API Documentation in Postman](https://documenter.getpostman.com/view/1678623/SzfDx54T?version=latest).

You can use the button in the top right corner **Run in Postman** to directly import these examples in [Postman](https://www.postman.com/) and give them a spin.

![Run in Postman button in the Postman documentation website][1]

One important detail to note: I'm logging each IP address calling this REST API and I'm counting the numbers of queries per IP in order to detect abuses. This will help me to take actions against abusive behaviours.

Also, remember that if you are trying to build an application that helps to detect, understand or stop the spread of the COVID-19 virus, we have a [FREE MongoDB Atlas credit program](https://www.mongodb.com/blog/post/helping-developers-tackle-covid19) that can help you scale and hopefully solve this global pandemic.

## But how did I build this?

Simple and easy, I used the [MongoDB App Services Third-Party HTTP services](https://www.mongodb.com/docs/atlas/app-services/reference/services/) to build my HTTP webhooks.

> [Third-Party Services](https://www.mongodb.com/docs/atlas/app-services/reference/services/) are now deprecated. Please use custom [HTTPS Endpoints instead](https://www.mongodb.com/docs/atlas/app-services/data-api/custom-endpoints/#std-label-https-endpoints) from now on.

Each time you call an API, a serverless JavaScript function is executed to fetch your documents. Let's look at the three parts of this function separately, for the **Global & US** webhook (the most detailed cllection!):

- First, I log the IP address each time a webhook is called. I'm using the IP address for my `_id` field which permits me to use an [upsert operation](https://docs.mongodb.com/manual/reference/method/db.collection.update/#insert-a-new-document-if-no-match-exists-upsert).

```javascript
function log_ip(payload) {
  const log = context.services.get("pre-prod").db("logs").collection("ip");
  let ip = "IP missing";
  try {
    ip = payload.headers["X-Envoy-External-Address"][0];
  } catch (error) {
    console.log("Can't retrieve IP address.")
  }
  console.log(ip);
  log.updateOne({"_id": ip}, {"$inc": {"queries": 1}}, {"upsert": true})
    .then( result => {
      console.log("IP + 1: " + ip);
    });
}
```

- Then I retrieve the query parameters and I build the query that I'm sending to the MongoDB cluster along with the [projection](https://docs.mongodb.com/manual/tutorial/project-fields-from-query-results/#return-all-but-the-excluded-fields) and [sort](https://docs.mongodb.com/manual/reference/method/cursor.sort/) options.

```javascript
function isPositiveInteger(str) {
    return ((parseInt(str, 10).toString() == str) && str.indexOf('-') === -1);
}

exports = function(payload, response) {
  log_ip(payload);

  const {uid, country, state, country_iso3, min_date, max_date, hide_fields} = payload.query;
  const coll = context.services.get("mongodb-atlas").db("covid19").collection("global_and_us");

  var query = {};
  var project = {};
  const sort = {'date': 1};

  if (uid !== undefined && isPositiveInteger(uid)) {
    query.uid = parseInt(uid, 10);
  }
  if (country !== undefined) {
    query.country = country;
  }
  if (state !== undefined) {
    query.state = state;
  }
  if (country_iso3 !== undefined) {
    query.country_iso3 = country_iso3;
  }
  if (min_date !== undefined && max_date === undefined) {
    query.date = {'$gte': new Date(min_date)};
  }
  if (max_date !== undefined && min_date === undefined) {
    query.date = {'$lte': new Date(max_date)};
  }
  if (min_date !== undefined && max_date !== undefined) {
    query.date = {'$gte': new Date(min_date), '$lte': new Date(max_date)};
  }
  if (hide_fields !== undefined) {
    const fields = hide_fields.split(',');
    for (let i = 0; i < fields.length; i++) {
      project[fields[i].trim()] = 0
    }
  }

  console.log('Query: ' + JSON.stringify(query));
  console.log('Projection: ' + JSON.stringify(project));
  // [...]
};
```

- Finally, I build the answer with the documents from the cluster and I'm adding a `Contact` header so you can send us an email if you want to reach out.

```javascript
exports = function(payload, response) {
  // [...]
  coll.find(query, project).sort(sort).toArray()
    .then( docs => {
      response.setBody(JSON.stringify(docs));
      response.setHeader("Contact","devrel@mongodb.com");
    });
};
```

Here is the entire JavaScript function if you want to copy & paste it.

```javascript
function isPositiveInteger(str) {
    return ((parseInt(str, 10).toString() == str) && str.indexOf('-') === -1);
}

function log_ip(payload) {
  const log = context.services.get("pre-prod").db("logs").collection("ip");
  let ip = "IP missing";
  try {
    ip = payload.headers["X-Envoy-External-Address"][0];
  } catch (error) {
    console.log("Can't retrieve IP address.")
  }
  console.log(ip);
  log.updateOne({"_id": ip}, {"$inc": {"queries": 1}}, {"upsert": true})
    .then( result => {
      console.log("IP + 1: " + ip);
    });
}

exports = function(payload, response) {
  log_ip(payload);

  const {uid, country, state, country_iso3, min_date, max_date, hide_fields} = payload.query;
  const coll = context.services.get("mongodb-atlas").db("covid19").collection("global_and_us");

  var query = {};
  var project = {};
  const sort = {'date': 1};

  if (uid !== undefined && isPositiveInteger(uid)) {
    query.uid = parseInt(uid, 10);
  }
  if (country !== undefined) {
    query.country = country;
  }
  if (state !== undefined) {
    query.state = state;
  }
  if (country_iso3 !== undefined) {
    query.country_iso3 = country_iso3;
  }
  if (min_date !== undefined && max_date === undefined) {
    query.date = {'$gte': new Date(min_date)};
  }
  if (max_date !== undefined && min_date === undefined) {
    query.date = {'$lte': new Date(max_date)};
  }
  if (min_date !== undefined && max_date !== undefined) {
    query.date = {'$gte': new Date(min_date), '$lte': new Date(max_date)};
  }
  if (hide_fields !== undefined) {
    const fields = hide_fields.split(',');
    for (let i = 0; i < fields.length; i++) {
      project[fields[i].trim()] = 0
    }
  }

  console.log('Query: ' + JSON.stringify(query));
  console.log('Projection: ' + JSON.stringify(project));

  coll.find(query, project).sort(sort).toArray()
    .then( docs => {
      response.setBody(JSON.stringify(docs));
      response.setHeader("Contact","devrel@mongodb.com");
    });
};
```

One detail to note: the payload is limited to 1MB per query. If you want to consume more data, I would recommend using the MongoDB cluster directly, as mentioned earlier, or I would filter the output to only the return the fields you really need using the `hide_fields` parameter. See the [documentation](https://documenter.getpostman.com/view/1678623/SzfDx54T?version=latest) for more details.

## Examples

Here are a couple of example of how to run a query.

- With this one you can retrieve all the metadata which will help you populate the query parameters in your other queries:

```shell
curl --location --request GET 'https://webhooks.mongodb-stitch.com/api/client/v2.0/app/covid-19-qppza/service/REST-API/incoming_webhook/metadata'
```

- The `covid19.global_and_us` collection is probably the most complete database in this system as it combines all the data from JHU's time series into a single collection. With the following query, you can filter down what you need from this collection:

```shell
curl --location --request GET 'https://webhooks.mongodb-stitch.com/api/client/v2.0/app/covid-19-qppza/service/REST-API/incoming_webhook/global_and_us?country=Canada&state=Alberta&min_date=2020-04-22T00:00:00.000Z&max_date=2020-04-27T00:00:00.000Z&hide_fields=_id,%20country,%20country_code,%20country_iso2,%20country_iso3,%20loc,%20state'
```

Again, the [REST API documentation in Postman](https://documenter.getpostman.com/view/1678623/SzfDx54T?version=latest) is the place to go to review all the options that are offered to you.

## Wrap Up

I truly hope you will be able to build something amazing with this REST API. Even if it won't save the world from this COVID-19 pandemic, I hope it will be a great source of motivation and training for your next pet project.

[Send me a tweet](https://twitter.com/intent/tweet?url=http://developer.mongodb.com/article/johns-hopkins-university-covid-19-rest-api&text=Take%20a%20look%20at%20my%20project%20%40MBeugnet%21) with your project, I will definitely check it out!

> If you have questions, please head to our developer community website where the MongoDB engineers and the MongoDB community will help you build your next big idea with MongoDB.

[1]: https://images.contentstack.io/v3/assets/blt39790b633ee0d5a7/blteee2f1e2d29d4361/6554356bf146760db015a198/postman_arrow.png
