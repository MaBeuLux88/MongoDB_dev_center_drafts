## Introduction

Introduced in June 2018 with MongoDB 4.0, multi-document ACID transactions are now supported.

But wait... Does that mean MongoDB did not support transactions before that?
No, MongoDB has consistently supported transactions, initially in the form of single-document transactions.

MongoDB 4.0 extends these transactional guarantees across multiple documents, multiple statements, multiple collections,
and multiple databases. What good would a database be without any form of transactional data integrity guarantee?

Before delving into the details, you can access the code and experiment with multi-document ACID
transactions [here](https://github.com/mongodb-developer/java-quick-start).

``` bash
git clone git@github.com:mongodb-developer/java-quick-start.git
```

## Quick Start

### Requirements

- Java 17
- Maven 3.8.7
- Docker (optional)

### Step 1: Start MongoDB

To get started with MongoDB Atlas and get a free cluster
read [this blog post](https://developer.mongodb.com/quickstart/free-atlas-cluster).

Or you can start an ephemeral single node Replica Set using Docker for testing quickly:

```bash
docker run --rm -d -p 27017:27017 -h $(hostname) --name mongo mongo:7.0.3 --replSet=RS && sleep 3 && docker exec mongo mongosh --quiet --eval "rs.initiate();"
```

### Step 2: Start Java

This demo contains two main programs: `ChangeStreams.java` and `Transactions.java`.

* The `ChangeSteams` class enables you to receive notifications of any data changes within the two collections used in
  this tutorial.
* The `Transactions` class is the demo itself.

You need two shells to run them.

First shell:

```
mvn compile exec:java -Dexec.mainClass="com.mongodb.quickstart.transactions.ChangeStreams" -Dmongodb.uri="mongodb+srv://USERNAME:PASSWORD@cluster0-abcde.mongodb.net/test?w=majority"
```

Second shell:

```
mvn compile exec:java -Dexec.mainClass="com.mongodb.quickstart.transactions.Transactions" -Dmongodb.uri="mongodb+srv://USERNAME:PASSWORD@cluster0-abcde.mongodb.net/test?w=majority"
```

> Note: Always execute the `ChangeStreams` program first because it creates the `product` collection with the
> required [JSON Schema](https://www.mongodb.com/docs/manual/reference/operator/query/jsonSchema/).

Let’s compare our existing single document transactions with MongoDB 4.0’s ACID compliant multi-document transactions
and see how we can leverage this new feature with Java.

## Prior to MongoDB 4.0

Even in MongoDB 3.6 and earlier, every write operation is represented as a **transaction scoped to the level of an
individual document** in the storage layer. Because the document model brings together related data that would otherwise
be modeled across separate parent-child tables in a tabular schema, MongoDB’s atomic single-document operations provide
transaction semantics that meet the data integrity needs of the majority of applications.

Every typical write operation modifying multiple documents actually happens in several independent transactions: one for
each document.

Let’s take an example with a very simple stock management application.

First of all, I need a [MongoDB Replica Set](https://www.mongodb.com/docs/manual/replication/) so please follow the
instructions given above to start MongoDB.

Now let’s insert the following documents into a `product` collection:

```js
db.product.insertMany([
    { "_id" : "beer", "price" : NumberDecimal("3.75"), "stock" : NumberInt(5) },
    { "_id" : "wine", "price" : NumberDecimal("7.5"), "stock" : NumberInt(3) }
])
```

Let’s imagine there is a sale on, and we want to offer our customers a 20% discount on all our products.

But before applying this discount, we want to monitor when these operations are happening in MongoDB with [Change
Streams](https://www.mongodb.com/docs/manual/changeStreams/).

Execute the following in a [MongoDB Shell](https://www.mongodb.com/docs/mongodb-shell/):

```js
cursor = db.product.watch([{$match: {operationType: "update"}}]);
while (!cursor.isClosed()) {
  let next = cursor.tryNext()
  while (next !== null) {
    printjson(next);
    next = cursor.tryNext()
  }
}
```

Keep this shell on the side, open another MongoDB Shell and apply the discount:

```js
RS [direct: primary] test> db.product.updateMany({}, {$mul: {price:0.8}})
{
  acknowledged: true,
  insertedId: null,
  matchedCount: 2,
  modifiedCount: 2,
  upsertedCount: 0
}
RS [direct: primary] test> db.product.find().pretty()
[
  { _id: 'beer', price: Decimal128("3.00000000000000000"), stock: 5 },
  { _id: 'wine', price: Decimal128("6.0000000000000000"), stock: 3 }
]
```

As you can see, both documents were updated with a single command line but not in a single transaction.
Here is what we can see in the Change Stream shell:

```js
{
  _id: {
    _data: '8265580539000000012B042C0100296E5A1004A7F55A5B35BD4C7DB2CD56C6CFEA9C49463C6F7065726174696F6E54797065003C7570646174650046646F63756D656E744B657900463C5F6964003C6265657200000004'
  },
  operationType: 'update',
  clusterTime: Timestamp({ t: 1700267321, i: 1 }),
  wallTime: ISODate("2023-11-18T00:28:41.601Z"),
  ns: {
    db: 'test',
    coll: 'product'
  },
  documentKey: {
    _id: 'beer'
  },
  updateDescription: {
    updatedFields: {
      price: Decimal128("3.00000000000000000")
    },
    removedFields: [],
    truncatedArrays: []
  }
}
{
  _id: {
    _data: '8265580539000000022B042C0100296E5A1004A7F55A5B35BD4C7DB2CD56C6CFEA9C49463C6F7065726174696F6E54797065003C7570646174650046646F63756D656E744B657900463C5F6964003C77696E6500000004'
  },
  operationType: 'update',
  clusterTime: Timestamp({ t: 1700267321, i: 2 }),
  wallTime: ISODate("2023-11-18T00:28:41.601Z"),
  ns: {
    db: 'test',
    coll: 'product'
  },
  documentKey: {
    _id: 'wine'
  },
  updateDescription: {
    updatedFields: {
      price: Decimal128("6.0000000000000000")
    },
    removedFields: [],
    truncatedArrays: []
  }
}
```

As you can see the cluster times (see the `clusterTime` key) of the two operations are different: the operations
occurred during the same second but the counter of the timestamp has been incremented by one.

Thus, here each document is updated one at a time, and even if this happens really fast, someone else could read the
documents while the update is running and see only one of the two products with the discount.

Most of the time, it is something you can tolerate in your MongoDB database because, as much as possible, we try to
embed tightly linked, or related data in the same document.

Consequently, two updates on the same document occur within a single transaction:

```js
RS [direct: primary] test> db.product.updateOne({_id: "wine"},{$inc: {stock:1}, $set: {description : "It’s the best wine on Earth"}})
{
  acknowledged: true,
  insertedId: null,
  matchedCount: 1,
  modifiedCount: 1,
  upsertedCount: 0
}
RS [direct: primary] test> db.product.findOne({_id: "wine"})
{
  _id: 'wine',
  price: Decimal128("6.0000000000000000"),
  stock: 4,
  description: 'It’s the best wine on Earth'
}
```

However, sometimes, you cannot model all of your related data in a single document, and there are a lot of valid reasons
for choosing not to embed documents.

## MongoDB 4.0 with Multi-Document ACID Transactions

Multi-document [ACID transactions](https://www.mongodb.com/basics/acid-transactions) in MongoDB closely resemble what
you may already be familiar with in traditional relational databases.

MongoDB’s transactions are a conversational set of related operations that must atomically commit or fully rollback with
all-or-nothing execution.

Transactions are used to make sure operations are atomic even across multiple collections or databases. Consequently,
with snapshot isolation reads, another user can only observe either all the operations or none of them.

Let’s now add a shopping cart to our example.

For this example, 2 collections are required because we are dealing with 2 different business entities: the stock
management and the shopping cart each client can create during shopping. The life cycles of each document in these
collections are different.

A document in the product collection represents an item I’m selling. This contains the current price of the product and
the current stock. I created a POJO to represent
it : [Product.java](https://github.com/mongodb-developer/java-quick-start/blob/master/src/main/java/com/mongodb/quickstart/transactions/models/Product.java).

```js
{ "_id" : "beer", "price" : NumberDecimal("3"), "stock" : NumberInt(5) }
```

A shopping cart is created when a client adds its first item in the cart and is removed when the client proceeds to
checkout or leaves the website. I created a POJO to represent
it : [Cart.java](https://github.com/mongodb-developer/java-quick-start/blob/master/src/main/java/com/mongodb/quickstart/transactions/models/Cart.java).

```js
{
  "_id" : "Alice",
  "items" : [
    {
      "price" : NumberDecimal("3"),
      "productId" : "beer",
      "quantity" : NumberInt(2)
    }
  ]
}
```

The challenge here resides in the fact that I cannot sell more than I possess: if I have 5 beers to sell, I cannot have
more than 5 beers distributed across the different client carts.

To ensure that, I have to make sure that the operation creating or updating the client cart is atomic with the stock
update. That’s where the multi-document transaction comes into play.
The transaction must fail in the case someone tries to buy something I do not have in my stock. I will add a constraint
on the product stock:

```js
db.product.drop()
db.createCollection("product", {
   validator: {
      $jsonSchema: {
         bsonType: "object",
         required: [ "_id", "price", "stock" ],
         properties: {
            _id: {
               bsonType: "string",
               description: "must be a string and is required"
            },
            price: {
               bsonType: "decimal",
               minimum: 0,
               description: "must be a positive decimal and is required"
            },
            stock: {
               bsonType: "int",
               minimum: 0,
               description: "must be a positive integer and is required"
            }
         }
      }
   }
})
```

> Note that this is already included in the Java code of the `ChangeStreams` class.

To monitor our example, we are going to use MongoDB [Change Streams](https://www.mongodb.com/docs/manual/changeStreams/)
that were introduced in MongoDB 3.6.

In [ChangeStreams.java](https://github.com/mongodb-developer/java-quick-start/blob/master/src/main/java/com/mongodb/quickstart/transactions/ChangeStreams.java),
I am going to monitor the database `test` which contains our 2 collections. It'll print each
operation with its associated cluster time.

```java
package com.mongodb.quickstart.transactions;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.CreateCollectionOptions;
import com.mongodb.client.model.ValidationAction;
import com.mongodb.client.model.ValidationOptions;
import org.bson.BsonDocument;

import static com.mongodb.client.model.changestream.FullDocument.UPDATE_LOOKUP;

public class ChangeStreams {

    private static final String CART = "cart";
    private static final String PRODUCT = "product";

    public static void main(String[] args) {
        ConnectionString connectionString = new ConnectionString(System.getProperty("mongodb.uri"));
        MongoClientSettings clientSettings = MongoClientSettings.builder()
                                                                .applyConnectionString(connectionString)
                                                                .build();
        try (MongoClient client = MongoClients.create(clientSettings)) {
            MongoDatabase db = client.getDatabase("test");
            System.out.println("Dropping the '" + db.getName() + "' database.");
            db.drop();
            System.out.println("Creating the '" + CART + "'  collection.");
            db.createCollection(CART);
            System.out.println("Creating the '" + PRODUCT + "' collection with a JSON Schema.");
            db.createCollection(PRODUCT, productJsonSchemaValidator());
            System.out.println("Watching the collections in the DB " + db.getName() + "...");
            db.watch()
              .fullDocument(UPDATE_LOOKUP)
              .forEach(doc -> System.out.println(doc.getClusterTime() + " => " + doc.getFullDocument()));
        }
    }

    private static CreateCollectionOptions productJsonSchemaValidator() {
        String jsonSchema = """
                            {
                              "$jsonSchema": {
                                "bsonType": "object",
                                "required": ["_id", "price", "stock"],
                                "properties": {
                                  "_id": {
                                    "bsonType": "string",
                                    "description": "must be a string and is required"
                                  },
                                  "price": {
                                    "bsonType": "decimal",
                                    "minimum": 0,
                                    "description": "must be a positive decimal and is required"
                                  },
                                  "stock": {
                                    "bsonType": "int",
                                    "minimum": 0,
                                    "description": "must be a positive integer and is required"
                                  }
                                }
                              }
                            }""";
        return new CreateCollectionOptions().validationOptions(
                new ValidationOptions().validationAction(ValidationAction.ERROR)
                                       .validator(BsonDocument.parse(jsonSchema)));
    }
}
```

In this example we have 5 beers to sell.

Alice wants to buy 2 beers, but we are **not** going to use a multi-document transaction for this. We will
observe in the change streams two operations at 2 different cluster times:

- one creating the cart
- one updating the stock

Then Alice adds 2 more beers in her cart, and we are going to use a transaction this time. The result in the change
stream will be 2 operations happening at the same cluster time.

Finally, she will try to order 2 extra beers but the jsonSchema validator will fail the product update (as there is only
one in stock) and result in a
rollback. We will not see anything in the change stream.
Below is the source code
for [Transaction.java](https://github.com/mongodb-developer/java-quick-start/blob/master/src/main/java/com/mongodb/quickstart/transactions/Transactions.java):

```java
package com.mongodb.quickstart.transactions;

import com.mongodb.*;
import com.mongodb.client.*;
import com.mongodb.quickstart.transactions.models.Cart;
import com.mongodb.quickstart.transactions.models.Product;
import org.bson.BsonDocument;
import org.bson.codecs.configuration.CodecRegistry;
import org.bson.codecs.pojo.PojoCodecProvider;
import org.bson.conversions.Bson;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static com.mongodb.client.model.Filters.*;
import static com.mongodb.client.model.Updates.inc;
import static org.bson.codecs.configuration.CodecRegistries.fromProviders;
import static org.bson.codecs.configuration.CodecRegistries.fromRegistries;

public class Transactions {

    private static final BigDecimal BEER_PRICE = BigDecimal.valueOf(3);
    private static final String BEER_ID = "beer";
    private static final Bson filterId = eq("_id", BEER_ID);
    private static final Bson filterAlice = eq("_id", "Alice");
    private static final Bson matchBeer = elemMatch("items", eq("productId", "beer"));
    private static final Bson incrementTwoBeers = inc("items.$.quantity", 2);
    private static final Bson decrementTwoBeers = inc("stock", -2);
    private static MongoCollection<Cart> cartCollection;
    private static MongoCollection<Product> productCollection;

    public static void main(String[] args) {
        ConnectionString connectionString = new ConnectionString(System.getProperty("mongodb.uri"));
        CodecRegistry pojoCodecRegistry = fromProviders(PojoCodecProvider.builder().automatic(true).build());
        CodecRegistry codecRegistry = fromRegistries(MongoClientSettings.getDefaultCodecRegistry(), pojoCodecRegistry);
        MongoClientSettings clientSettings = MongoClientSettings.builder()
                                                                .applyConnectionString(connectionString)
                                                                .codecRegistry(codecRegistry)
                                                                .build();
        try (MongoClient client = MongoClients.create(clientSettings)) {
            MongoDatabase db = client.getDatabase("test");
            cartCollection = db.getCollection("cart", Cart.class);
            productCollection = db.getCollection("product", Product.class);
            transactionsDemo(client);
        }
    }

    private static void transactionsDemo(MongoClient client) {
        clearCollections();
        insertProductBeer();
        printDatabaseState();
        System.out.println("""
                           #########  NO  TRANSACTION #########
                           Alice wants 2 beers.
                           We have to create a cart in the 'cart' collection and update the stock in the 'product' collection.
                           The 2 actions are correlated but can not be executed at the same cluster time.
                           Any error blocking one operation could result in stock error or a sale of beer that we can't fulfill as we have no stock.
                           ------------------------------------""");
        aliceWantsTwoBeers();
        sleep();
        removingBeersFromStock();
        System.out.println("####################################\n");
        printDatabaseState();
        sleep();
        System.out.println("""
                           ######### WITH TRANSACTION #########
                           Alice wants 2 extra beers.
                           Now we can update the 2 collections simultaneously.
                           The 2 operations only happen when the transaction is committed.
                           ------------------------------------""");
        aliceWantsTwoExtraBeersInTransactionThenCommitOrRollback(client);
        sleep();
        System.out.println("""
                           ######### WITH TRANSACTION #########
                           Alice wants 2 extra beers.
                           This time we do not have enough beers in stock so the transaction will rollback.
                           ------------------------------------""");
        aliceWantsTwoExtraBeersInTransactionThenCommitOrRollback(client);
    }

    private static void aliceWantsTwoExtraBeersInTransactionThenCommitOrRollback(MongoClient client) {
        ClientSession session = client.startSession();
        try {
            session.startTransaction(TransactionOptions.builder().writeConcern(WriteConcern.MAJORITY).build());
            aliceWantsTwoExtraBeers(session);
            sleep();
            removingBeerFromStock(session);
            session.commitTransaction();
        } catch (MongoException e) {
            session.abortTransaction();
            System.out.println("####### ROLLBACK TRANSACTION #######");
        } finally {
            session.close();
            System.out.println("####################################\n");
            printDatabaseState();
        }
    }

    private static void removingBeersFromStock() {
        System.out.println("Trying to update beer stock : -2 beers.");
        try {
            productCollection.updateOne(filterId, decrementTwoBeers);
        } catch (MongoException e) {
            System.out.println("########   MongoException   ########");
            System.out.println("##### STOCK CANNOT BE NEGATIVE #####");
            throw e;
        }
    }

    private static void removingBeerFromStock(ClientSession session) {
        System.out.println("Trying to update beer stock : -2 beers.");
        try {
            productCollection.updateOne(session, filterId, decrementTwoBeers);
        } catch (MongoException e) {
            System.out.println("########   MongoException   ########");
            System.out.println("##### STOCK CANNOT BE NEGATIVE #####");
            throw e;
        }
    }

    private static void aliceWantsTwoBeers() {
        System.out.println("Alice adds 2 beers in her cart.");
        cartCollection.insertOne(new Cart("Alice", List.of(new Cart.Item(BEER_ID, 2, BEER_PRICE))));
    }

    private static void aliceWantsTwoExtraBeers(ClientSession session) {
        System.out.println("Updating Alice cart : adding 2 beers.");
        cartCollection.updateOne(session, and(filterAlice, matchBeer), incrementTwoBeers);
    }

    private static void insertProductBeer() {
        productCollection.insertOne(new Product(BEER_ID, 5, BEER_PRICE));
    }

    private static void clearCollections() {
        productCollection.deleteMany(new BsonDocument());
        cartCollection.deleteMany(new BsonDocument());
    }

    private static void printDatabaseState() {
        System.out.println("Database state:");
        printProducts(productCollection.find().into(new ArrayList<>()));
        printCarts(cartCollection.find().into(new ArrayList<>()));
        System.out.println();
    }

    private static void printProducts(List<Product> products) {
        products.forEach(System.out::println);
    }

    private static void printCarts(List<Cart> carts) {
        if (carts.isEmpty()) {
            System.out.println("No carts...");
        } else {
            carts.forEach(System.out::println);
        }
    }

    private static void sleep() {
        System.out.println("Sleeping 1 second...");
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            System.err.println("Oops!");
            e.printStackTrace();
        }
    }
}
```

Here is the console of the Change Stream :

```
Dropping the 'test' database.
Creating the 'cart'  collection.
Creating the 'product' collection with a JSON Schema.
Watching the collections in the DB test...
Timestamp{value=7304460075832180737, seconds=1700702141, inc=1} => Document{{_id=beer, price=3, stock=5}}
Timestamp{value=7304460075832180738, seconds=1700702141, inc=2} => Document{{_id=Alice, items=[Document{{price=3, productId=beer, quantity=2}}]}}
Timestamp{value=7304460080127148033, seconds=1700702142, inc=1} => Document{{_id=beer, price=3, stock=3}}
Timestamp{value=7304460088717082625, seconds=1700702144, inc=1} => Document{{_id=Alice, items=[Document{{price=3, productId=beer, quantity=4}}]}}
Timestamp{value=7304460088717082625, seconds=1700702144, inc=1} => Document{{_id=beer, price=3, stock=1}}
```

As you can see here, we only get five operations because the two last operations were never committed to the database,
and therefore the change stream has nothing to show.

- The first operation is the product collection initialization (create the product document for the beers).
- The second and third operations are the first 2 beers Alice adds to her cart *without* a multi-doc transaction. Notice
  that the two operations do *not* happen on the same cluster time.
- The two last operations are the two additional beers Alice adds to her cart *with* a multi-doc transaction. Notice
  that this time the two operations are atomic, and they are happening exactly at the same cluster time.

Here is the console of the Transaction java process that sums up everything I said earlier.

```
Database state:
Product{id='beer', stock=5, price=3}
No carts...

#########  NO  TRANSACTION #########
Alice wants 2 beers.
We have to create a cart in the 'cart' collection and update the stock in the 'product' collection.
The 2 actions are correlated but can not be executed on the same cluster time.
Any error blocking one operation could result in stock error or a sale of beer that we can't fulfill as we have no stock.
------------------------------------
Alice adds 2 beers in her cart.
Sleeping 1 second...
Trying to update beer stock : -2 beers.
####################################

Database state:
Product{id='beer', stock=3, price=3}
Cart{id='Alice', items=[Item{productId=beer, quantity=2, price=3}]}

Sleeping 1 second...
######### WITH TRANSACTION #########
Alice wants 2 extra beers.
Now we can update the 2 collections simultaneously.
The 2 operations only happen when the transaction is committed.
------------------------------------
Updating Alice cart : adding 2 beers.
Sleeping 1 second...
Trying to update beer stock : -2 beers.
####################################

Database state:
Product{id='beer', stock=1, price=3}
Cart{id='Alice', items=[Item{productId=beer, quantity=4, price=3}]}

Sleeping 1 second...
######### WITH TRANSACTION #########
Alice wants 2 extra beers.
This time we do not have enough beers in stock so the transaction will rollback.
------------------------------------
Updating Alice cart : adding 2 beers.
Sleeping 1 second...
Trying to update beer stock : -2 beers.
########   MongoException   ########
##### STOCK CANNOT BE NEGATIVE #####
####### ROLLBACK TRANSACTION #######
####################################

Database state:
Product{id='beer', stock=1, price=3}
Cart{id='Alice', items=[Item{productId=beer, quantity=4, price=3}]}
```

## Next Steps

Thanks for taking the time to read my post. I hope you found it useful and interesting.
As a reminder, all the code is
available [on this GitHub repository](https://github.com/mongodb-developer/java-quick-start)
for you to experiment.

If you're seeking an easy way to begin with MongoDB, you can achieve that in just five clicks using
our [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cloud database service.
