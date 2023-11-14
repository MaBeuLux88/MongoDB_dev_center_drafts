## Updates

The MongoDB Java quickstart repository is [available on Github](https://github.com/mongodb-developer/java-quick-start).

### November 14th, 2023

- Update to Java 17
- Update Java Driver to 4.11.1
- Update mongodb-crypt to 1.8.0

### March 25th, 2021

- Update Java Driver to 4.2.2.
- Added Client Side Field Level Encryption example.

### October 21st, 2020

- Update Java Driver to 4.1.1.
- The Java Driver logging is now enabled via the popular [SLF4J](http://www.slf4j.org/) API so I added logback in
  the `pom.xml` and a configuration file `logback.xml`.

## What's the Client Side Field Level Encryption?

<div>
    <img 
        style="float: right;
        border-radius: 10px;
        margin-bottom: 30px;
        vertical-align: bottom;
        width: 30%;"
        src="https://mongodb-devhub-cms.s3.us-west-1.amazonaws.com/old_images/qs-badges/qs-badge-java.png" alt="Java badge" />

The [Client Side Field Level Encryption](https://docs.mongodb.com/manual/core/security-client-side-encryption/) (CSFLE
for short) is a new feature added in MongoDB 4.2 that allows you to encrypt some fields of your MongoDB documents prior
to transmitting them over the wire to the cluster for storage.
</div>

It's the ultimate piece of security against any kind of intrusion or snooping around your MongoDB cluster. Only the
application with the correct encryption keys can decrypt and read the protected data.

Let's check out the Java CSFLE API with a simple example.

## Getting Set Up

I will use the same repository as usual in this series. If you don't have a copy of it yet, you can clone it or just
update it if you already have it:

``` sh
git clone git@github.com:mongodb-developer/java-quick-start.git
```

> If you didn't set up your free cluster on MongoDB Atlas, now is great time to do so. You have all the instructions in
> this [post](/quickstart/free-atlas-cluster/).

For this CSFLE quickstart post, I will only use the Community Edition of MongoDB. As a matter of fact, the only part of
CSFLE that is an enterprise-only feature is the
automatic [encryption of fields](https://www.mongodb.com/docs/v7.0/core/queryable-encryption/fundamentals/encrypt-and-query/)
which is supported
by [mongocryptd](https://www.mongodb.com/docs/manual/core/csfle/reference/mongocryptd/#std-label-csfle-reference-mongocryptd)
or
the [Automatic Encryption Shared Library for Queryable Encryption](https://www.mongodb.com/docs/v7.0/core/queryable-encryption/reference/shared-library/#std-label-qe-reference-shared-library).

> Automatic Encryption Shared Library for Queryable Encryption is a replacement for mongocryptd and should be the
> preferred solution. They are both optional and part of MongoDB Enterprise.

In this tutorial, I will be using the explicit (or manual) encryption of fields which doesn't require `mongocryptd` and
the enterprise edition of MongoDB or Atlas. If you would like to explore the enterprise version of CSFLE with Java, you
can find out more
in [this documentation](https://www.mongodb.com/docs/manual/core/csfle/quick-start/#std-label-csfle-quick-start) or in
my more recent
post: [How to Implement Client-Side Field Level Encryption (CSFLE) in Java with Spring Data MongoDB](https://www.mongodb.com/developer/code-examples/java/java-spring-data-client-side-field-level-encryption/).

> Do not confuse `mongocryptd` with the `libmongocrypt` library which is the companion C library used by the drivers to
> encrypt and decrypt your data. We *need* this library to run CSFLE. I added it in the `pom.xml` file of this project.

``` xml
<dependency>
  <groupId>org.mongodb</groupId>
  <artifactId>mongodb-crypt</artifactId>
  <version>1.8.0</version>
</dependency>
```

To keep the code samples short and sweet in the examples below, I will only share the most relevant parts. If you want
to see the code working with all its context, please check the source code in the github repository in
the [csfle package](https://github.com/mongodb-developer/java-quick-start/tree/master/src/main/java/com/mongodb/quickstart/csfle)
directly.

## Run the Quickstart Code

In this quickstart tutorial, I will show you the CSFLE API using the MongoDB Java Driver. I will show you how to:

- create and configure the MongoDB connections we need.
- create a master key.
- create Data Encryption Keys (DEK).
- create and read encrypted documents.

To run my code from the above repository, check out
the [README](https://github.com/mongodb-developer/java-quick-start/blob/master/README.md).

But for short, the following command should get you up and running in no time:

``` shell
mvn compile exec:java -Dexec.mainClass="com.mongodb.quickstart.csfle.ClientSideFieldLevelEncryption" -Dmongodb.uri="mongodb+srv://USERNAME:PASSWORD@cluster0-abcde.mongodb.net/test?w=majority" -Dexec.cleanupDaemonThreads=false
```

This is the output you should get:

``` none
**************
* MASTER KEY *
**************
A new Master Key has been generated and saved to file "master_key.txt".
Master Key: [100, 82, 127, -61, -92, -93, 0, -11, 41, -96, 89, -39, -26, -25, -33, 37, 85, -50, 64, 70, -91, 99, -44, -57, 18, 105, -101, -111, -67, -81, -19, 56, -112, 62, 11, 106, -6, 85, -125, 49, -7, -49, 38, 81, 24, -48, -6, -15, 21, -120, -37, -5, 65, 82, 74, -84, -74, -65, -43, -15, 40, 80, -23, -52, -114, -18, -78, -64, -37, -3, -23, -33, 102, -44, 32, 65, 70, -123, -97, -49, -13, 126, 33, -63, -75, -52, 78, -5, -107, 91, 126, 103, 118, 104, 86, -79]

******************
* INITIALIZATION *
******************
=> Creating local Key Management System using the master key.
=> Creating encryption client.
=> Creating MongoDB client with automatic decryption.
=> Cleaning entire cluster.

*************************************
* CREATE KEY ALT NAMES UNIQUE INDEX *
*************************************

*******************************
* CREATE DATA ENCRYPTION KEYS *
*******************************
Created Bobby's data key ID: 668a35af-df8f-4c41-9493-8d09d3d46d3b
Created Alice's data key ID: 003024b3-a3b6-490a-9f31-7abb7bcc334d

************************************************
* INSERT ENCRYPTED DOCUMENTS FOR BOBBY & ALICE *
************************************************
2 docs have been inserted.

**********************************
* FIND BOBBY'S DOCUMENT BY PHONE *
**********************************
Bobby document found by phone number:
{
  "_id": {
    "$oid": "60551bc8dd8b737958e3733f"
  },
  "name": "Bobby",
  "age": 33,
  "phone": "01 23 45 67 89",
  "blood_type": "A+",
  "medical_record": [
    {
      "test": "heart",
      "result": "bad"
    }
  ]
}

****************************
* READING ALICE'S DOCUMENT *
****************************
Before we remove Alice's key, we can read her document.
{
  "_id": {
    "$oid": "60551bc8dd8b737958e37340"
  },
  "name": "Alice",
  "age": 28,
  "phone": "09 87 65 43 21",
  "blood_type": "O+"
}

***************************************************************
* REMOVE ALICE's KEY + RESET THE CONNECTION (reset DEK cache) *
***************************************************************
Alice key is now removed: 1 key removed.
=> Creating MongoDB client with automatic decryption.

****************************************
* TRY TO READ ALICE DOC AGAIN BUT FAIL *
****************************************
We get a MongoException because 'libmongocrypt' can't decrypt these fields anymore.
```

Let's have a look in depth to understand what is happening.

## How it Works

![CSFLE diagram with master key and DEK vault](https://mongodb-devhub-cms.s3.us-west-1.amazonaws.com/old_images/quickstart/java-csfle/csfle-diagram.png)

CSFLE looks complicated, like any security and encryption feature, I guess. Let's try to make it simple in a few words.

1. We need
   a [master key](https://docs.mongodb.com/drivers/security/client-side-field-level-encryption-guide/#std-label-fle-create-a-master-key)
   which unlocks all
   the [Data Encryption Keys](https://docs.mongodb.com/drivers/security/client-side-field-level-encryption-guide/#b.-create-a-data-encryption-key) (
   DEK for short) that we can use to encrypt one or more fields in our documents.
2. You can use one DEK for our entire cluster or a different DEK for each field of each document in your cluster. It's
   up to you.
3. The DEKs are stored in a collection in a MongoDB cluster which does **not** have to be the same that contains the
   encrypted data. The DEKs are stored **encrypted**. They are useless without the master key which needs to be
   protected.
4. You can use the manual (community edition) or the automated (enterprise advanced or Atlas) encryption of fields.
5. The decryption can be manual or automated. Both are part of the community edition of MongoDB. In this post, I will
   use manual encryption and automated decryption to stick with the community edition of MongoDB.

## GDPR Compliance

<div>
<img style="float: right;
        border-radius: 10px;
        margin-bottom: 30px;
        vertical-align: bottom;
        width: 40%;" alt="GDPR logo" src="https://mongodb-devhub-cms.s3.us-west-1.amazonaws.com/old_images/quickstart/java-csfle/GDPR.jpg" />

European laws enforce data protection and privacy. Any oversight can result in massive fines.

CSFLE is a great way to save [millions of dollars/euros](https://en.wikipedia.org/wiki/GDPR_fines_and_notices).

For example, CSFLE could be a great way to enforce
the ["right-to-be-forgotten" policy](https://gdpr-info.eu/art-17-gdpr/) of GDPR. If a user asks to be removed from your
systems, the data must be erased from your production cluster, of course, but also the logs, the dev environment, and
the backups... And let's face it: Nobody will ever remove this user's data from the backups. And if you ever restore or
use these backups, this can cost you millions of dollars/euros.
</div>

But now... encrypt each user's data with a unique Data Encryption Key (DEK) and to "forget" a user forever, all you have
to do is lose the key. So, saving the DEKs on a separated cluster and enforcing a low retention policy on this cluster
will ensure that a user is truly forgotten forever once the key is deleted.

[Kenneth White](https://www.linkedin.com/in/biotech/), Security Principal at MongoDB who worked on CSFLE, explains this
perfectly
in [this answer](https://developer.mongodb.com/community/forums/t/client-side-field-level-encryption-deks-and-backups/13577/2)
in the [MongoDB Community Forum](https://developer.mongodb.com/community/forums/).

> If the primary motivation is just to provably ensure that deleted plaintext user records remain deleted no matter
> what, then it becomes a simple timing and separation of concerns strategy, and the most straight-forward solution is to
> move the keyvault collection to a different database or cluster completely, configured with a much shorter backup
> retention; FLE does not assume your encrypted keyvault collection is co-resident with your active cluster or has the
> same access controls and backup history, just that the client can, when needed, make an authenticated connection to that
> keyvault database. Important to note though that with a shorter backup cycle, in the event of some catastrophic data
> corruption (malicious, intentional, or accidental), all keys for that db (and therefore all encrypted data) are only as
> recoverable to the point in time as the shorter keyvault backup would restore.

More trivial, but in the event of an intrusion, any stolen data will be completely worthless without the master key and
would not result in a ruinous fine.

## The Master Key

The master key is an array of 96 bytes. It can be stored in a Key Management Service in a cloud provider or can be
locally
managed ([documentation](https://docs.mongodb.com/drivers/security/client-side-field-level-encryption-local-key-to-kms/)).
One way or another, you must secure it from any threat.

It's as simple as that to generate a new one:

``` java
final byte[] masterKey = new byte[96];
new SecureRandom().nextBytes(masterKey);
```

But you most probably just want to do this once and then reuse the same one each time you restart your application.

Here is my implementation to store it in a local file the first time and then reuse it for each restart.

``` java
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.security.SecureRandom;
import java.util.Arrays;

public class MasterKey {

    private static final int SIZE_MASTER_KEY = 96;
    private static final String MASTER_KEY_FILENAME = "master_key.txt";

    public static void main(String[] args) {
        new MasterKey().tutorial();
    }

    private void tutorial() {
        final byte[] masterKey = generateNewOrRetrieveMasterKeyFromFile(MASTER_KEY_FILENAME);
        System.out.println("Master Key: " + Arrays.toString(masterKey));
    }

    private byte[] generateNewOrRetrieveMasterKeyFromFile(String filename) {
        byte[] masterKey = new byte[SIZE_MASTER_KEY];
        try {
            retrieveMasterKeyFromFile(filename, masterKey);
            System.out.println("An existing Master Key was found in file \"" + filename + "\".");
        } catch (IOException e) {
            masterKey = generateMasterKey();
            saveMasterKeyToFile(filename, masterKey);
            System.out.println("A new Master Key has been generated and saved to file \"" + filename + "\".");
        }
        return masterKey;
    }

    private void retrieveMasterKeyFromFile(String filename, byte[] masterKey) throws IOException {
        try (FileInputStream fis = new FileInputStream(filename)) {
            fis.read(masterKey, 0, SIZE_MASTER_KEY);
        }
    }

    private byte[] generateMasterKey() {
        byte[] masterKey = new byte[SIZE_MASTER_KEY];
        new SecureRandom().nextBytes(masterKey);
        return masterKey;
    }

    private void saveMasterKeyToFile(String filename, byte[] masterKey) {
        try (FileOutputStream fos = new FileOutputStream(filename)) {
            fos.write(masterKey);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

> This is nowhere near safe for a production environment because leaving the `master_key.txt` directly in the
> application folder on your production server is like leaving the vault combination on a sticky note. Secure that file or
> please consider using
> a [KMS](https://docs.mongodb.com/drivers/security/client-side-field-level-encryption-local-key-to-kms/) in production.

In this simple quickstart, I will only use a single master key, but it's totally possible to use multiple master keys.

## The Key Management Service (KMS) Provider

Whichever solution you choose for the master key, you need
a [KMS provider](https://docs.mongodb.com/drivers/security/client-side-field-level-encryption-local-key-to-kms/) to set
up the `ClientEncryptionSettings` and the `AutoEncryptionSettings`.

Here is the configuration for a local KMS:

``` java
Map<String, Map<String, Object>> kmsProviders = new HashMap<String, Map<String, Object>>() {{
    put("local", new HashMap<String, Object>() {{
        put("key", localMasterKey);
    }});
}};
```

## The Clients

We will need to set up two different clients:

- The first one ─ `ClientEncryption` ─ will be used to create our Data Encryption Keys (DEK) and encrypt our fields
  manually.
- The second one ─ `MongoClient` ─ will be the more conventional MongoDB connection that we will use to read and write
  our documents, with the difference that it will be configured to automatically decrypt the encrypted fields.

### ClientEncryption

``` java
ConnectionString connection_string = new ConnectionString("mongodb://localhost");
MongoClientSettings kvmcs = MongoClientSettings.builder().applyConnectionString(connection_string).build();

ClientEncryptionSettings ces = ClientEncryptionSettings.builder()
                                                       .keyVaultMongoClientSettings(kvmcs)
                                                       .keyVaultNamespace("csfle.vault")
                                                       .kmsProviders(kmsProviders)
                                                       .build();

ClientEncryption encryption = ClientEncryptions.create(ces);
```

### MongoClient

``` java
AutoEncryptionSettings aes = AutoEncryptionSettings.builder()
                                                   .keyVaultNamespace("csfle.vault")
                                                   .kmsProviders(kmsProviders)
                                                   .bypassAutoEncryption(true)
                                                   .build();

MongoClientSettings mcs = MongoClientSettings.builder()
                                             .applyConnectionString(connection_string)
                                             .autoEncryptionSettings(aes)
                                             .build();

MongoClient client = MongoClients.create(mcs);
```

> `bypassAutoEncryption(true)` is the ticket for the Community Edition. Without it, `mongocryptd` would rely on the JSON
> schema that you would have to provide to encrypt automatically the documents. See
> this [example in the documentation](https://mongodb.github.io/mongo-java-driver/4.2/driver/tutorials/client-side-encryption/#examples).

> You don't have to reuse the same connection string for both connections. It would actually be a lot more "
> GDPR-friendly" to use separated clusters so you can enforce a low retention policy on the Data Encryption Keys.

## Unique Index on Key Alternate Names

The first thing you should do before you create your first Data Encryption Key is to create a unique index on the key
alternate names to make sure that you can't reuse the same alternate name on two different DEKs.

These names will help you "label" your keys to know what each one is used for ─ which is still totally up to you.

``` java
MongoCollection<Document> vaultColl = client.getDatabase("csfle").getCollection("vault");
vaultColl.createIndex(ascending("keyAltNames"),
                      new IndexOptions().unique(true).partialFilterExpression(exists("keyAltNames")));
```

In my example, I choose to use one DEK per user. I will encrypt all the fields I want to secure in each user document
with the same key. If I want to "forget" a user, I just need to drop that key. In my example, the names are unique so
I'm using this for my `keyAltNames`. It's a great way to enforce GDPR compliance.

## Create Data Encryption Keys

Let's create two Data Encryption Keys: one for Bobby and one for Alice. Each will be used to encrypt all the fields I
want to keep safe in my respective user documents.

``` java
BsonBinary bobbyKeyId = encryption.createDataKey("local", keyAltName("Bobby"));
BsonBinary aliceKeyId = encryption.createDataKey("local", keyAltName("Alice"));
```

We get a little help from this private method to make my code easier to read:

``` java
private DataKeyOptions keyAltName(String altName) {
    return new DataKeyOptions().keyAltNames(List.of(altName));
}
```

Here is what Bobby's DEK looks like in my `csfle.vault` collection:

``` json
{
  "_id" : UUID("aaa2e53d-875e-49d8-9ce0-dec9a9658571"),
  "keyAltNames" : [ "Bobby" ],
  "keyMaterial" : BinData(0,"/ozPZBMNUJU9udZyTYe1hX/KHqJJPrjdPads8UNjHX+cZVkIXnweZe5pGPpzcVcGmYctTAdxB3b+lmY5ONTzEZkqMg8JIWenIWQVY5fogIpfHDJQylQoEjXV3+e3ZY1WmWJR8mOp7pMoTyoGlZU2TwyqT9fcN7E5pNRh0uL3kCPk0sOOxLT/ejQISoY/wxq2uvyIK/C6/LrD1ymIC9w6YA=="),
  "creationDate" : ISODate("2021-03-19T16:16:09.800Z"),
  "updateDate" : ISODate("2021-03-19T16:16:09.800Z"),
  "status" : 0,
  "masterKey" : {
    "provider" : "local"
  }
}
```

As you can see above, the `keyMaterial` (the DEK itself) is encrypted by the master key. Without the master key to
decrypt it, it's useless. Also, you can identify that it's Bobby's key in the `keyAltNames` field.

## Create Encrypted Documents

Now that we have an encryption key for Bobby and Alice, I can create their respective documents and insert them into
MongoDB like so:

``` java
private static final String DETERMINISTIC = "AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic";
private static final String RANDOM = "AEAD_AES_256_CBC_HMAC_SHA_512-Random";

private Document createBobbyDoc(ClientEncryption encryption) {
    BsonBinary phone = encryption.encrypt(new BsonString("01 23 45 67 89"), deterministic(BOBBY));
    BsonBinary bloodType = encryption.encrypt(new BsonString("A+"), random(BOBBY));
    BsonDocument medicalEntry = new BsonDocument("test", new BsonString("heart")).append("result", new BsonString("bad"));
    BsonBinary medicalRecord = encryption.encrypt(new BsonArray(List.of(medicalEntry)), random(BOBBY));
    return new Document("name", BOBBY).append("age", 33)
                                      .append("phone", phone)
                                      .append("blood_type", bloodType)
                                      .append("medical_record", medicalRecord);
}

private Document createAliceDoc(ClientEncryption encryption) {
    BsonBinary phone = encryption.encrypt(new BsonString("09 87 65 43 21"), deterministic(ALICE));
    BsonBinary bloodType = encryption.encrypt(new BsonString("O+"), random(ALICE));
    return new Document("name", ALICE).append("age", 28).append("phone", phone).append("blood_type", bloodType);
}

private EncryptOptions deterministic(String keyAltName) {
    return new EncryptOptions(DETERMINISTIC).keyAltName(keyAltName);
}

private EncryptOptions random(String keyAltName) {
    return new EncryptOptions(RANDOM).keyAltName(keyAltName);
}

private void createAndInsertBobbyAndAlice(ClientEncryption encryption, MongoCollection<Document> usersColl) {
    Document bobby = createBobbyDoc(encryption);
    Document alice = createAliceDoc(encryption);
    int nbInsertedDocs = usersColl.insertMany(List.of(bobby, alice)).getInsertedIds().size();
    System.out.println(nbInsertedDocs + " docs have been inserted.");
}
```

Here is what Bobby and Alice documents look like in my `encrypted.users` collection:

**Bobby**

``` json
{
  "_id" : ObjectId("6054d91c26a275034fe53300"),
  "name" : "Bobby",
  "age" : 33,
  "phone" : BinData(6,"ATKkRdZWR0+HpqNyYA7zgIUCgeBE4SvLRwaXz/rFl8NPZsirWdHRE51pPa/2W9xgZ13lnHd56J1PLu9uv/hSkBgajE+MJLwQvJUkXatOJGbZd56BizxyKKTH+iy+8vV7CmY="),
  "blood_type" : BinData(6,"AjKkRdZWR0+HpqNyYA7zgIUCUdc30A8lTi2i1pWn7CRpz60yrDps7A8gUJhJdj+BEqIIx9xSUQ7xpnc/6ri2/+ostFtxIq/b6IQArGi+8ZBISw=="),
  "medical_record" : BinData(6,"AjKkRdZWR0+HpqNyYA7zgIUESl5s4tPPvzqwe788XF8o91+JNqOUgo5kiZDKZ8qudloPutr6S5cE8iHAJ0AsbZDYq7XCqbqiXvjQobObvslR90xJvVMQidHzWtqWMlzig6ejdZQswz2/WT78RrON8awO")
}
```

**Alice**

``` json
{
  "_id" : ObjectId("6054d91c26a275034fe53301"),
  "name" : "Alice",
  "age" : 28,
  "phone" : BinData(6,"AX7Xd65LHUcWgYj+KbUT++sCC6xaCZ1zaMtzabawAgB79quwKvld8fpA+0m+CtGevGyIgVRjtj2jAHAOvREsoy3oq9p5mbJvnBqi8NttHUJpqooUn22Wx7o+nlo633QO8+c="),
  "blood_type" : BinData(6,"An7Xd65LHUcWgYj+KbUT++sCTyp+PJXudAKM5HcdX21vB0VBHqEXYSplHdZR0sCOxzBMPanVsTRrOSdAK5yHThP3Vitsu9jlbNo+lz5f3L7KYQ==")
}
```

Client Side Field Level Encryption currently
provides [two different algorithms](https://docs.mongodb.com/manual/core/security-client-side-encryption/#encryption-algorithms)
to encrypt the data you want to secure.

### AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic

With this algorithm, the result of the encryption ─ given the same inputs (value and DEK) ─
is [deterministic](https://en.wikipedia.org/wiki/Deterministic_encryption). This means that we have a greater support
for read operations, but encrypted data with low [cardinality](https://en.wikipedia.org/wiki/Cardinality) is susceptible
to [frequency analysis attacks](https://en.wikipedia.org/wiki/Frequency_analysis).

In my example, if I want to be able to retrieve users by phone numbers, I must use the deterministic algorithm. As a
phone number is likely to be unique in my collection of users, it's safe to use this algorithm here.

### AEAD_AES_256_CBC_HMAC_SHA_512-Random

With this algorithm, the result of the encryption is
*always* [different](https://en.wikipedia.org/wiki/Probabilistic_encryption). That means that it provides the strongest
guarantees of data confidentiality, even when the cardinality is low, but prevents read operations based on these
fields.

In my example, the blood type has a low cardinality and it doesn't make sense to search in my user collection by blood
type anyway, so it's safe to use this algorithm for this field.

Also, Bobby's medical record must be very safe. So, the entire subdocument containing all his medical records is
encrypted with the random algorithm as well and won't be used to search Bobby in my collection anyway.

## Read Bobby's Document

As mentioned in the previous section, it's possible to search documents by fields encrypted with the deterministic
algorithm.

Here is how:

``` java
BsonBinary phone = encryption.encrypt(new BsonString("01 23 45 67 89"), deterministic(BOBBY));
String doc = usersColl.find(eq("phone", phone)).first().toJson();
```

I simply encrypt again, with the same key, the phone number I'm looking for, and I can use this `BsonBinary` in my query
to find Bobby.

If I output the `doc` string, I get:

``` none
{
  "_id": {
    "$oid": "6054d91c26a275034fe53300"
  },
  "name": "Bobby",
  "age": 33,
  "phone": "01 23 45 67 89",
  "blood_type": "A+",
  "medical_record": [
    {
      "test": "heart",
      "result": "bad"
    }
  ]
}
```

As you can see, the automatic decryption worked as expected, I can see my document in clear text. To find this document,
I could use the `_id`, the `name`, the `age`, or the phone number, but not the `blood_type` or the `medical_record`.

## Read Alice's Document

Now let's put CSFLE to the test. I want to be sure that if Alice's DEK is destroyed, Alice's document is lost forever
and can never be restored, even from a backup that could be restored. That's why it's important to keep the DEKs and the
encrypted documents in two different clusters that don't have the same backup retention policy.

Let's retrieve Alice's document by name, but let's protect my code in case something "bad" has happened to her key...

``` java
private void readAliceIfPossible(MongoCollection<Document> usersColl) {
    try {
        String aliceDoc = usersColl.find(eq("name", ALICE)).first().toJson();
        System.out.println("Before we remove Alice's key, we can read her document.");
        System.out.println(aliceDoc);
    } catch (MongoException e) {
        System.err.println("We get a MongoException because 'libmongocrypt' can't decrypt these fields anymore.");
    }
}
```

If her key still exists in the database, then I can decrypt her document:

``` none
{
  "_id": {
    "$oid": "6054d91c26a275034fe53301"
  },
  "name": "Alice",
  "age": 28,
  "phone": "09 87 65 43 21",
  "blood_type": "O+"
}
```

Now, let's remove her key from the database:

``` java
vaultColl.deleteOne(eq("keyAltNames", ALICE));
```

In a real-life production environment, it wouldn't make sense to read her document again; and because we are all
professional and organised developers who like to keep things tidy, we would also delete Alice's document along with her
DEK, as this document is now completely worthless for us anyway.

In my example, I want to try to read this document anyway. But if I try to read it immediately after deleting her
document, there is a great chance that I will still able to do so because of
the [60 seconds Data Encryption Key Cache](https://github.com/mongodb/specifications/blob/master/source/client-side-encryption/client-side-encryption.rst#libmongocrypt-data-key-caching)
that is managed by `libmongocrypt`.

This cache is very important because, without it, multiple back-and-forth would be necessary to decrypt my document.
It's critical to prevent CSFLE from killing the performances of your MongoDB cluster.

So, to make sure I'm not using this cache anymore, I'm creating a brand new `MongoClient` (still with auto decryption
settings) for the sake of this example. But of course, in production, it wouldn't make sense to do so.

Now if I try to access Alice's document again, I get the following `MongoException`, as expected:

``` none
com.mongodb.MongoException: not all keys requested were satisfied
  at com.mongodb.MongoException.fromThrowableNonNull(MongoException.java:83)
  at com.mongodb.client.internal.Crypt.fetchKeys(Crypt.java:286)
  at com.mongodb.client.internal.Crypt.executeStateMachine(Crypt.java:244)
  at com.mongodb.client.internal.Crypt.decrypt(Crypt.java:128)
  at com.mongodb.client.internal.CryptConnection.command(CryptConnection.java:121)
  at com.mongodb.client.internal.CryptConnection.command(CryptConnection.java:131)
  at com.mongodb.internal.operation.CommandOperationHelper.executeCommand(CommandOperationHelper.java:345)
  at com.mongodb.internal.operation.CommandOperationHelper.executeCommand(CommandOperationHelper.java:336)
  at com.mongodb.internal.operation.CommandOperationHelper.executeCommandWithConnection(CommandOperationHelper.java:222)
  at com.mongodb.internal.operation.FindOperation$1.call(FindOperation.java:658)
  at com.mongodb.internal.operation.FindOperation$1.call(FindOperation.java:652)
  at com.mongodb.internal.operation.OperationHelper.withReadConnectionSource(OperationHelper.java:583)
  at com.mongodb.internal.operation.FindOperation.execute(FindOperation.java:652)
  at com.mongodb.internal.operation.FindOperation.execute(FindOperation.java:80)
  at com.mongodb.client.internal.MongoClientDelegate$DelegateOperationExecutor.execute(MongoClientDelegate.java:170)
  at com.mongodb.client.internal.FindIterableImpl.first(FindIterableImpl.java:200)
  at com.mongodb.quickstart.csfle.ClientSideFieldLevelEncryption.readAliceIfPossible(ClientSideFieldLevelEncryption.java:91)
  at com.mongodb.quickstart.csfle.ClientSideFieldLevelEncryption.demo(ClientSideFieldLevelEncryption.java:79)
  at com.mongodb.quickstart.csfle.ClientSideFieldLevelEncryption.main(ClientSideFieldLevelEncryption.java:41)
Caused by: com.mongodb.crypt.capi.MongoCryptException: not all keys requested were satisfied
  at com.mongodb.crypt.capi.MongoCryptContextImpl.throwExceptionFromStatus(MongoCryptContextImpl.java:145)
  at com.mongodb.crypt.capi.MongoCryptContextImpl.throwExceptionFromStatus(MongoCryptContextImpl.java:151)
  at com.mongodb.crypt.capi.MongoCryptContextImpl.completeMongoOperation(MongoCryptContextImpl.java:93)
  at com.mongodb.client.internal.Crypt.fetchKeys(Crypt.java:284)
  ... 17 more
```

## Wrapping Up

In this quickstart tutorial, we have discovered how to use Client Side Field Level Encryption using the MongoDB Java
Driver, using only the community edition of MongoDB. You can learn more about
the [automated encryption](https://docs.mongodb.com/manual/core/security-automatic-client-side-encryption/) in our
documentation.

CSFLE is the ultimate security feature to ensure the maximal level of security for your cluster. Not even your admins
will be able to access the data in production if they don't have access to the master keys.

But it's not the only security measure you should use to protect your cluster. Preventing access to your cluster is, of
course, the first security measure that you should enforce
by [enabling the authentication](https://docs.mongodb.com/manual/tutorial/enable-authentication/)
and [limit network exposure](https://docs.mongodb.com/manual/administration/security-checklist/#arrow-limit-network-exposure).

In doubt, check out the [security checklist](https://docs.mongodb.com/manual/administration/security-checklist/) before
launching a cluster in production to make sure that you didn't overlook any of the security options MongoDB has to offer
to protect your data.

There is a lot of flexibility in the implementation of CSFLE: You can choose to use one or multiple master keys, same
for the Data Encryption Keys. You can also choose to encrypt all your phone numbers in your collection with the same DEK
or use a different one for each user. It's really up to you how you will organise your encryption strategy but, of
course, make sure it fulfills all your legal obligations. There are multiple right ways to implement CSFLE, so make sure
to find the most suitable one for your use case.

> If you have questions, please head to our [developer community website](https://community.mongodb.com/) where the
> MongoDB engineers and the MongoDB community will help you build your next big idea with MongoDB.

### Documentation

- [GitHub repository with all the Java Quickstart examples of this series](https://github.com/mongodb-developer/java-quick-start)
- [MongoDB CSFLE Doc](https://www.mongodb.com/docs/manual/core/csfle/)
- [MongoDB Java Driver CSFLE Doc](https://www.mongodb.com/docs/drivers/java/sync/current/fundamentals/encrypt-fields/)
- [MongoDB University CSFLE implementation example](https://github.com/mongodb-university/csfle-guides/tree/master/java/)
