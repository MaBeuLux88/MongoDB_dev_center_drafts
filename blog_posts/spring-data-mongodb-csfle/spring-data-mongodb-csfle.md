## Maxime TODO List

- Check the repository links in this blog post before publication.
- Move my code to mongodb-repository.
  - My code: https://github.com/MaBeuLux88/mongodb-java-spring-boot-csfle
  - Old repo: https://github.com/mongodb-developer/java-spring-boot-csfle

## Notes for reviewers:

Please review this repo for now: https://github.com/MaBeuLux88/mongodb-java-spring-boot-csfle

Google Doc for Reviews: https://docs.google.com/document/d/1Abq_GRa5Vs1ZVwypQ29khRzLGyHBuJpMqrvoX3Hqff8/edit?usp=sharing

Blog post starts below this line.

## GitHub Repository

The source code of this template is available on GitHub:

```bash
git clone https://github.com/MaBeuLux88/mongodb-java-spring-boot-csfle
```

To get started, you'll need:

- Java 17 (can't use Java 21 yet because Spring Boot 3.1.4 is not compatible)
- [MongoDB Cluster](https://www.mongodb.com/atlas/database) v7.0.2 or higher.
- [MongoDB Automatic Encryption Shared Library](https://www.mongodb.com/docs/manual/core/queryable-encryption/reference/shared-library/#download-the-automatic-encryption-shared-library)
  v7.0.2 or higher.

See the [README.md](https://github.com/mongodb-developer/java-spring-boot-csfle/blob/main/README.md) file for more
information.

## Introduction

This blog post will explain the key details of the integration of
MongoDB [Client-Side Field Level Encryption](https://www.mongodb.com/docs/manual/core/csfle/) (CSFLE)
with [Spring Data MongoDB](https://spring.io/projects/spring-data-mongodb).

However, this blog post will *not* explain the basic mechanics of CSFLE
or [Spring Data MongoDB](https://spring.io/projects/spring-data-mongodb).

If you feel like you need a refresher on CSFLE before working on this more complicated piece, I can recommend a few
resources for CSFLE:

- My blog post /
  tutorial: [CSFLE with Java](https://www.mongodb.com/developer/languages/java/java-client-side-field-level-encryption/) (
  without Spring Data...)
- [CSFLE MongoDB Documentation](https://www.mongodb.com/docs/manual/core/csfle/)
- [CSFLE Encryption Schemas](https://www.mongodb.com/docs/manual/core/csfle/reference/encryption-schemas/)
- [CSFLE Quick Start](https://www.mongodb.com/docs/manual/core/csfle/quick-start/)

And for Spring Data MongoDB:

- [Spring Data MongoDB - Project](https://spring.io/projects/spring-data-mongodb)
- [Spring Data MongoDB - Documentation](https://docs.spring.io/spring-data/mongodb/docs/current/reference/html/)
- [Baeldung Spring Data MongoDB Tutorial](https://www.baeldung.com/spring-data-mongodb-tutorial)
- [Spring Initializr](https://start.spring.io/)

This template is *significantly* larger than other online CSFLE template you can find online. It tries to provide
reusable code for a real production environment using:

- multiple encrypted collections,
- automated JSON Schema generation,
- server side JSON Schema,
- separated clusters for DEKs and encrypted collections,
- automated Data Encryption Keys generation or retrieval,
- SpEL Evaluation Extension,
- auto-implemented repositories,
- Open API documentation 3.0.1,
- and much more.

While I was coding, I also tried to respect the [SOLID Principales](https://www.baeldung.com/solid-principles) as much
as possible to increase the code readability, usability and reutilization.

## High Level Diagrams

Now that we are all on board, here is a high level diagram of the different moving parts required to create a correctly
configured MongoClient which can encrypt and decrypt fields automatically.

![Project High Level Diagram][1]

The arrows can mean different things in the diagram:

- "needs to be done before"
- "requires"
- "direct dependency of"

But hopefully it helps to understand the dependencies, the orchestration and the inner machinery of the CSFLE
configuration with Spring Data MongoDB:

Once the connection with MongoDB—capable of encrypting and decrypting the fields—is established, with the correct
configuration and library, we are just using a classical three-tier architecture to expose a REST API and manage the
communication all the way down to the MongoDB database.

![Three-tier architecture][2]

Here, nothing tricky or fascinating to discuss, so we are not going to discuss this in this blog post.

Let's now discuss all the complicated bits of this template.

## Creation of the Key Vault Collection

As this is a tutorial, the code can be started from a blank MongoDB cluster.

So the first point of order is to create the key vault collection and its unique index on the `keyAltNames` field.

[KeyVaultAndDekSetup.java](https://github.com/MaBeuLux88/mongodb-java-spring-boot-csfle/blob/main/src/main/java/com/mongodb/quickstart/javaspringbootcsfle/components/KeyVaultAndDekSetup.java)

```java
/**
 * This class initialize the Key Vault (collection + keyAltNames unique index) using a dedicated standard connection
 * to MongoDB.
 * Then it creates the Data Encryption Keys (DEKs) required to encrypt the documents in each of the
 * encrypted collections.
 */
@Component
public class KeyVaultAndDekSetup {

    private static final Logger LOGGER = LoggerFactory.getLogger(KeyVaultAndDekSetup.class);
    private final KeyVaultService keyVaultService;
    private final DataEncryptionKeyService dataEncryptionKeyService;
    @Value("${spring.data.mongodb.vault.uri}")
    private String CONNECTION_STR;

    public KeyVaultAndDekSetup(KeyVaultService keyVaultService, DataEncryptionKeyService dataEncryptionKeyService) {
        this.keyVaultService = keyVaultService;
        this.dataEncryptionKeyService = dataEncryptionKeyService;
    }

    @PostConstruct
    public void postConstruct() {
        LOGGER.info("=> Start Encryption Setup.");
        LOGGER.debug("=> MongoDB Connection String: {}", CONNECTION_STR);
        MongoClientSettings mcs = MongoClientSettings.builder()
                                                     .applyConnectionString(new ConnectionString(CONNECTION_STR))
                                                     .build();
        try (MongoClient client = MongoClients.create(mcs)) {
            LOGGER.info("=> Created the MongoClient instance for the encryption setup.");
            LOGGER.info("=> Creating the encryption key vault collection.");
            keyVaultService.setupKeyVaultCollection(client);
            LOGGER.info("=> Creating the Data Encryption Keys.");
            EncryptedCollectionsConfiguration.encryptedEntities.forEach(dataEncryptionKeyService::createOrRetrieveDEK);
            LOGGER.info("=> Encryption Setup completed.");
        } catch (Exception e) {
            LOGGER.error("=> Encryption Setup failed: {}", e.getMessage(), e);
        }

    }

}
```


In production, you could choose to create the key vault collection and its unique index on the `keyAltNames` field
manually once and remove the code as it's never going to be executed again. I guess it only makes sense to keep it if
you are running this code in a CI/CD pipeline.

One important thing to note here is the dependency to a completely standard and ephemeral `MongoClient` (use of a
try-with-resources block) as we are already creating a collection and an index in our MongoDB cluster.

[KeyVaultServiceImpl.java](https://github.com/MaBeuLux88/mongodb-java-spring-boot-csfle/blob/main/src/main/java/com/mongodb/quickstart/javaspringbootcsfle/csfleServiceImpl/KeyVaultServiceImpl.java)

```java
/**
 * Initialization of the Key Vault collection and keyAltNames unique index.
 */
@Service
public class KeyVaultServiceImpl implements KeyVaultService {

    private static final Logger LOGGER = LoggerFactory.getLogger(KeyVaultServiceImpl.class);
    private static final String INDEX_NAME = "uniqueKeyAltNames";
    @Value("${mongodb.key.vault.db}")
    private String KEY_VAULT_DB;
    @Value("${mongodb.key.vault.coll}")
    private String KEY_VAULT_COLL;

    public void setupKeyVaultCollection(MongoClient mongoClient) {
        LOGGER.info("=> Setup the key vault collection {}.{}", KEY_VAULT_DB, KEY_VAULT_COLL);
        MongoDatabase db = mongoClient.getDatabase(KEY_VAULT_DB);
        MongoCollection<Document> vault = db.getCollection(KEY_VAULT_COLL);
        boolean vaultExists = doesCollectionExist(db, KEY_VAULT_COLL);
        if (vaultExists) {
            LOGGER.info("=> Vault collection already exists.");
            if (!doesIndexExist(vault)) {
                LOGGER.info("=> Unique index created on the keyAltNames");
                createKeyVaultIndex(vault);
            }
        } else {
            LOGGER.info("=> Creating a new vault collection & index on keyAltNames.");
            createKeyVaultIndex(vault);
        }
    }

    private void createKeyVaultIndex(MongoCollection<Document> vault) {
        Bson keyAltNamesExists = exists("keyAltNames");
        IndexOptions indexOpts = new IndexOptions().name(INDEX_NAME)
                                                   .partialFilterExpression(keyAltNamesExists)
                                                   .unique(true);
        vault.createIndex(new BsonDocument("keyAltNames", new BsonInt32(1)), indexOpts);
    }

    private boolean doesCollectionExist(MongoDatabase db, String coll) {
        return db.listCollectionNames().into(new ArrayList<>()).stream().anyMatch(c -> c.equals(coll));
    }

    private boolean doesIndexExist(MongoCollection<Document> coll) {
        return coll.listIndexes()
                   .into(new ArrayList<>())
                   .stream()
                   .map(i -> i.get("name"))
                   .anyMatch(n -> n.equals(INDEX_NAME));
    }
}
```


When it's done, we can close the standard MongoDB connection.

## Creation of the Data Encryption Keys

We can now create the Data Encryption Keys (DEKs) using the `ClientEncryption` connection.

[MongoDBKeyVaultClientConfiguration.java](https://github.com/MaBeuLux88/mongodb-java-spring-boot-csfle/blob/main/src/main/java/com/mongodb/quickstart/javaspringbootcsfle/configuration/MongoDBKeyVaultClientConfiguration.java)

```java
/**
 * ClientEncryption used by the DataEncryptionKeyService to create the DEKs.
 */
@Configuration
public class MongoDBKeyVaultClientConfiguration {

    private static final Logger LOGGER = LoggerFactory.getLogger(MongoDBKeyVaultClientConfiguration.class);
    private final KmsService kmsService;
    @Value("${spring.data.mongodb.vault.uri}")
    private String CONNECTION_STR;
    @Value("${mongodb.key.vault.db}")
    private String KEY_VAULT_DB;
    @Value("${mongodb.key.vault.coll}")
    private String KEY_VAULT_COLL;
    private MongoNamespace KEY_VAULT_NS;

    public MongoDBKeyVaultClientConfiguration(KmsService kmsService) {
        this.kmsService = kmsService;
    }

    @PostConstruct
    public void postConstructor() {
        this.KEY_VAULT_NS = new MongoNamespace(KEY_VAULT_DB, KEY_VAULT_COLL);
    }

    /**
     * MongoDB Encryption Client that can manage Data Encryption Keys (DEKs).
     *
     * @return ClientEncryption MongoDB connection that can create or delete DEKs.
     */
    @Bean
    public ClientEncryption clientEncryption() {
        LOGGER.info("=> Creating the MongoDB Key Vault Client.");
        MongoClientSettings mcs = MongoClientSettings.builder()
                                                     .applyConnectionString(new ConnectionString(CONNECTION_STR))
                                                     .build();
        ClientEncryptionSettings ces = ClientEncryptionSettings.builder()
                                                               .keyVaultMongoClientSettings(mcs)
                                                               .keyVaultNamespace(KEY_VAULT_NS.getFullName())
                                                               .kmsProviders(kmsService.getKmsProviders())
                                                               .build();
        return ClientEncryptions.create(ces);
    }
}
```


We can instantiate directly a `ClientEncryption` bean using
the [KMS](https://www.mongodb.com/docs/manual/core/queryable-encryption/fundamentals/kms-providers/) and use it to
generate our DEKs (one for each encrypted collection).

[DataEncryptionKeyServiceImpl.java](https://github.com/MaBeuLux88/mongodb-java-spring-boot-csfle/blob/main/src/main/java/com/mongodb/quickstart/javaspringbootcsfle/csfleServiceImpl/DataEncryptionKeyServiceImpl.java)

```java
/**
 * Service responsible for creating and remembering the Data Encryption Keys (DEKs).
 * We need to retrieve the DEKs when we evaluate the SpEL expressions in the Entities to create the JSON Schemas.
 */
@Service
public class DataEncryptionKeyServiceImpl implements DataEncryptionKeyService {

    private static final Logger LOGGER = LoggerFactory.getLogger(DataEncryptionKeyServiceImpl.class);
    private final ClientEncryption clientEncryption;
    private final Map<String, String> dataEncryptionKeysB64 = new HashMap<>();
    @Value("${mongodb.kms.provider}")
    private String KMS_PROVIDER;

    public DataEncryptionKeyServiceImpl(ClientEncryption clientEncryption) {
        this.clientEncryption = clientEncryption;
    }

    public Map<String, String> getDataEncryptionKeysB64() {
        LOGGER.info("=> Getting Data Encryption Keys Base64 Map.");
        LOGGER.info("=> Keys in DEK Map: {}", dataEncryptionKeysB64.entrySet());
        return dataEncryptionKeysB64;
    }

    public String createOrRetrieveDEK(EncryptedEntity encryptedEntity) {
        Base64.Encoder b64Encoder = Base64.getEncoder();
        String dekName = encryptedEntity.getDekName();
        BsonDocument dek = clientEncryption.getKeyByAltName(dekName);
        BsonBinary dataKeyId;
        if (dek == null) {
            LOGGER.info("=> Creating Data Encryption Key: {}", dekName);
            DataKeyOptions dko = new DataKeyOptions().keyAltNames(of(dekName));
            dataKeyId = clientEncryption.createDataKey(KMS_PROVIDER, dko);
            LOGGER.debug("=> DEK ID: {}", dataKeyId);
        } else {
            LOGGER.info("=> Existing Data Encryption Key: {}", dekName);
            dataKeyId = dek.get("_id").asBinary();
            LOGGER.debug("=> DEK ID: {}", dataKeyId);
        }
        String dek64 = b64Encoder.encodeToString(dataKeyId.getData());
        LOGGER.debug("=> Base64 DEK ID: {}", dek64);
        LOGGER.info("=> Adding Data Encryption Key to the Map with key: {}",
                    encryptedEntity.getEntityClass().getSimpleName());
        dataEncryptionKeysB64.put(encryptedEntity.getEntityClass().getSimpleName(), dek64);
        return dek64;
    }

}
```


One thing to note here is that we are storing the DEKs in a map, so we don't have to retrieve them again later when we
need them for the JSON Schemas.

## Entities

One of the key functional areas of Spring Data MongoDB is the POJO centric model it relies on to implement the
repositories and map the documents to the MongoDB collections.

PersonEntity.java

```java
/**
 * This is the entity class for the "persons" collection.
 * The SpEL expression of the @Encrypted annotation is used to determine the DEK's keyId to use for the encryption.
 *
 * @see com.mongodb.quickstart.javaspringbootcsfle.components.EntitySpelEvaluationExtension
 */
@Document("persons")
@Encrypted(keyId = "#{mongocrypt.keyId(#target)}")
public class PersonEntity {
    @Id
    private ObjectId id;
    private String firstName;
    private String lastName;
    @Encrypted(algorithm = "AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic")
    private String ssn;
    @Encrypted(algorithm = "AEAD_AES_256_CBC_HMAC_SHA_512-Random")
    private String bloodType;

    // Constructors

    @Override
    // toString()

    // Getters & Setters
}
```


As you can see above, this entity contains all the information we need to fully automate CSFLE. We have the information
we need to generate the JSON Schema:

- Using the SpEL expression `#{mongocrypt.keyId(#target)}` we can populate dynamically the DEK that was generated or
  retrieved earlier.
- `ssn` is a String that requires a deterministic algorithm.
- `bloodType` is a String that requires a random algorithm.

The generated JSON Schema looks like this:

```json
{
  "encryptMetadata": {
    "keyId": [
      {
        "$binary": {
          "base64": "WyHXZ+53SSqCC/6WdCvp0w==",
          "subType": "04"
        }
      }
    ]
  },
  "type": "object",
  "properties": {
    "ssn": {
      "encrypt": {
        "bsonType": "string",
        "algorithm": "AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic"
      }
    },
    "bloodType": {
      "encrypt": {
        "bsonType": "string",
        "algorithm": "AEAD_AES_256_CBC_HMAC_SHA_512-Random"
      }
    }
  }
}
```


## SpEL Evaluation Extension

The evaluation of the SpEL expression is only possible because of this class we added in the configuration:

```java
/**
 * Will evaluate the SePL expressions in the Entity classes like this: #{mongocrypt.keyId(#target)} and insert
 * the right encryption key for the right collection.
 */
@Component
public class EntitySpelEvaluationExtension implements EvaluationContextExtension {

    private static final Logger LOGGER = LoggerFactory.getLogger(EntitySpelEvaluationExtension.class);
    private final DataEncryptionKeyService dataEncryptionKeyService;

    public EntitySpelEvaluationExtension(DataEncryptionKeyService dataEncryptionKeyService) {
        this.dataEncryptionKeyService = dataEncryptionKeyService;
    }

    @Override
    @NonNull
    public String getExtensionId() {
        return "mongocrypt";
    }

    @Override
    @NonNull
    public Map<String, Function> getFunctions() {
        try {
            return Collections.singletonMap("keyId", new Function(
                    EntitySpelEvaluationExtension.class.getMethod("computeKeyId", String.class), this));
        } catch (NoSuchMethodException e) {
            throw new RuntimeException(e);
        }
    }

    public String computeKeyId(String target) {
        String dek = dataEncryptionKeyService.getDataEncryptionKeysB64().get(target);
        LOGGER.info("=> Computing dek for target {} => {}", target, dek);
        return dek;
    }
}
```


Note that it's the place where we are retrieving the DEKs and matching them with the `target`: "PersonEntity" in this
case.

## JSON Schemas and the MongoClient Connection

JSON Schemas are actually not trivial to generate in a Spring Data MongoDB project.

As a matter of fact, to generate the JSON Schemas, we need the MappingContext (the entities, etc.) which is created by
the automatic configuration of Spring Data which creates the `MongoClient` connection and the `MongoTemplate`...

But to create the MongoClient—with the automatic encryption enabled—you need the JSON Schemas!

It took me a significant amount of time to find a solution to this deadlock, and you can just enjoy the solution now!

The solution is to inject the JSON Schema creation in the autoconfiguration process by instantiating
the `MongoClientSettingsBuilderCustomizer` bean.

[MongoDBSecureClientConfiguration.java](https://github.com/MaBeuLux88/mongodb-java-spring-boot-csfle/blob/main/src/main/java/com/mongodb/quickstart/javaspringbootcsfle/configuration/MongoDBSecureClientConfiguration.java)

```java
/**
 * Spring Data MongoDB Configuration for the encrypted MongoClient with all the required configuration (jsonSchemas).
 * The big trick in this file is the creation of the JSON Schemas before the creation of the entire configuration as
 * we need the MappingContext to resolve the SpEL expressions in the entities.
 *
 * @see com.mongodb.quickstart.javaspringbootcsfle.components.EntitySpelEvaluationExtension
 */
@Configuration
@DependsOn("keyVaultAndDekSetup")
public class MongoDBSecureClientConfiguration {

    private static final Logger LOGGER = LoggerFactory.getLogger(MongoDBSecureClientConfiguration.class);
    private final KmsService kmsService;
    private final SchemaService schemaService;
    @Value("${crypt.shared.lib.path}")
    private String CRYPT_SHARED_LIB_PATH;
    @Value("${spring.data.mongodb.storage.uri}")
    private String CONNECTION_STR_DATA;
    @Value("${spring.data.mongodb.vault.uri}")
    private String CONNECTION_STR_VAULT;
    @Value("${mongodb.key.vault.db}")
    private String KEY_VAULT_DB;
    @Value("${mongodb.key.vault.coll}")
    private String KEY_VAULT_COLL;
    private MongoNamespace KEY_VAULT_NS;

    public MongoDBSecureClientConfiguration(KmsService kmsService, SchemaService schemaService) {
        this.kmsService = kmsService;
        this.schemaService = schemaService;
    }

    @PostConstruct
    public void postConstruct() {
        this.KEY_VAULT_NS = new MongoNamespace(KEY_VAULT_DB, KEY_VAULT_COLL);
    }

    @Bean
    public MongoClientSettings mongoClientSettings() {
        LOGGER.info("=> Creating the MongoClientSettings for the encrypted collections.");
        return MongoClientSettings.builder().applyConnectionString(new ConnectionString(CONNECTION_STR_DATA)).build();
    }

    @Bean
    public MongoClientSettingsBuilderCustomizer customizer(MappingContext mappingContext) {
        LOGGER.info("=> Creating the MongoClientSettingsBuilderCustomizer.");
        return builder -> {
            MongoJsonSchemaCreator schemaCreator = MongoJsonSchemaCreator.create(mappingContext);
            Map<String, BsonDocument> schemaMap = schemaService.generateSchemasMap(schemaCreator)
                                                               .entrySet()
                                                               .stream()
                                                               .collect(toMap(e -> e.getKey().getFullName(),
                                                                              Map.Entry::getValue));
            Map<String, Object> extraOptions = Map.of("cryptSharedLibPath", CRYPT_SHARED_LIB_PATH,
                                                      "cryptSharedLibRequired", true);
            MongoClientSettings mcs = MongoClientSettings.builder()
                                                         .applyConnectionString(
                                                                 new ConnectionString(CONNECTION_STR_VAULT))
                                                         .build();
            AutoEncryptionSettings oes = AutoEncryptionSettings.builder()
                                                               .keyVaultMongoClientSettings(mcs)
                                                               .keyVaultNamespace(KEY_VAULT_NS.getFullName())
                                                               .kmsProviders(kmsService.getKmsProviders())
                                                               .schemaMap(schemaMap)
                                                               .extraOptions(extraOptions)
                                                               .build();
            builder.autoEncryptionSettings(oes);
        };
    }
}
```


> One thing to note here is the option to separate the DEKs from the encrypted collections in two completely separated
> MongoDB clusters. This isn't mandatory, but it can be a handy trick if you choose to have a different backup retention
> policy for your two clusters. This can be interesting for the GDPR Article 17 "Right to erasure" for instance as you
> can then guarantee that a DEK can completely disappear from your systems (backup included). I talk more about this
> approach in
> this [Java CSFLE blog post](https://www.mongodb.com/developer/languages/java/java-client-side-field-level-encryption/).

Here is the JSON Schema service which stores the generated JSON schemas in a map:

[SchemaServiceImpl.java](https://github.com/MaBeuLux88/mongodb-java-spring-boot-csfle/blob/main/src/main/java/com/mongodb/quickstart/javaspringbootcsfle/csfleServiceImpl/SchemaServiceImpl.java)

```java

@Service
public class SchemaServiceImpl implements SchemaService {

    private static final Logger LOGGER = LoggerFactory.getLogger(SchemaServiceImpl.class);
    private Map<MongoNamespace, BsonDocument> schemasMap;

    @Override
    public Map<MongoNamespace, BsonDocument> generateSchemasMap(MongoJsonSchemaCreator schemaCreator) {
        LOGGER.info("=> Generating schema map.");
        List<EncryptedEntity> encryptedEntities = EncryptedCollectionsConfiguration.encryptedEntities;
        return schemasMap = encryptedEntities.stream()
                                             .collect(toMap(EncryptedEntity::getNamespace,
                                                            e -> generateSchema(schemaCreator, e.getEntityClass())));
    }

    @Override
    public Map<MongoNamespace, BsonDocument> getSchemasMap() {
        return schemasMap;
    }

    private BsonDocument generateSchema(MongoJsonSchemaCreator schemaCreator, Class<?> entityClass) {
        BsonDocument schema = schemaCreator.filter(MongoJsonSchemaCreator.encryptedOnly())
                                           .createSchemaFor(entityClass)
                                           .schemaDocument()
                                           .toBsonDocument();
        LOGGER.info("=> JSON Schema for {}:\n{}", entityClass.getSimpleName(),
                    schema.toJson(JsonWriterSettings.builder().indent(true).build()));
        return schema;
    }

}
```


We are storing the JSON Schemas because this template also implements one of the good practices of CSFLE: server-side
JSON Schemas.

## Create or Update the Encrypted Collections

Indeed, to make the automatic encryption and decryption of CSFLE work, you do not require the server-side JSON Schemas.

Only the client-side ones are required for the Automatic Encryption Shared Library. But then nothing would prevent
another misconfigured client or an admin connected directly to the cluster to insert or update some documents without
encrypting the fields.

To enforce this you can use the server-side JSON Schema as you would do to enforce a field type in a document for
instance.

But given that the JSON Schema will evolve with the different versions of your application, the JSON Schemas needs to be
updated accordingly each time you restart your application.

```java
/**
 * Create or update the encrypted collections with a server side JSON Schema to secure the encrypted field in the MongoDB database.
 * This prevents any other client from inserting or editing the fields without encrypting the fields correctly.
 */
@Component
public class EncryptedCollectionsSetup {

    private static final Logger LOGGER = LoggerFactory.getLogger(EncryptedCollectionsSetup.class);
    private final MongoClient mongoClient;
    private final SchemaService schemaService;

    public EncryptedCollectionsSetup(MongoClient mongoClient, SchemaService schemaService) {
        this.mongoClient = mongoClient;
        this.schemaService = schemaService;
    }

    @PostConstruct
    public void postConstruct() {
        LOGGER.info("=> Setup the encrypted collections.");
        schemaService.getSchemasMap()
                     .forEach((namespace, schema) -> createOrUpdateCollection(mongoClient, namespace, schema));
    }

    private void createOrUpdateCollection(MongoClient mongoClient, MongoNamespace ns, BsonDocument schema) {
        MongoDatabase db = mongoClient.getDatabase(ns.getDatabaseName());
        String collStr = ns.getCollectionName();
        if (doesCollectionExist(db, ns)) {
            LOGGER.info("=> Updating {} collection's server side JSON Schema.", ns.getFullName());
            db.runCommand(new Document("collMod", collStr).append("validator", jsonSchemaWrapper(schema)));
        } else {
            LOGGER.info("=> Creating encrypted collection {} with server side JSON Schema.", ns.getFullName());
            db.createCollection(collStr, new CreateCollectionOptions().validationOptions(
                    new ValidationOptions().validator(jsonSchemaWrapper(schema))));
        }
    }

    public BsonDocument jsonSchemaWrapper(BsonDocument schema) {
        return new BsonDocument("$jsonSchema", schema);
    }

    private boolean doesCollectionExist(MongoDatabase db, MongoNamespace ns) {
        return db.listCollectionNames()
                 .into(new ArrayList<>())
                 .stream()
                 .anyMatch(c -> c.equals(ns.getCollectionName()));
    }

}
```


## Multi-Entities Support

One big feature of this template as well is the support of multiple entities. As you probably noticed already, there is
a `CompanyEntity` and all its related components but the code is generic enough to handle any amount of entities which
isn't usually the case in all the other online tutorials.

In this template, if you want to support a third type of entity, you just have to create the components of the
three-tier architecture as usual and add your entry in the `EncryptedCollectionsConfiguration` class.

[EncryptedCollectionsConfiguration.java](https://github.com/MaBeuLux88/mongodb-java-spring-boot-csfle/blob/main/src/main/java/com/mongodb/quickstart/javaspringbootcsfle/configuration/EncryptedCollectionsConfiguration.java)

```java
/**
 * Information about the encrypted collections in the application.
 * As I need the information in multiple places, I decided to create a configuration class with a static list of
 * the encrypted collections and their information.
 */
public class EncryptedCollectionsConfiguration {
    public static final List<EncryptedEntity> encryptedEntities = List.of(
            new EncryptedEntity("mydb", "persons", PersonEntity.class, "personDEK"),
            new EncryptedEntity("mydb", "companies", CompanyEntity.class, "companyDEK"));
}
```


Everything else from the DEK generation to the encrypted collection creation with the server-side JSON Schema is fully
automated and taken care of transparently. All you have to do is specify
the `@Encrypted(algorithm = "AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic")` annotation in the entity class and the field
will be encrypted and decrypted automatically for you when you are using the auto-implemented repositories (courtesy of
Spring Data MongoDB of course!).

## Query by an Encrypted Field

Maybe you noticed but this template implements the `findFirstBySsn(ssn)` method which means that it's possible to
retrieve a person document by its SSN number, even if this field is encrypted.

> Note that it only works because we are using a Deterministic encryption algorithm.

[PersonRepository.java](https://github.com/MaBeuLux88/mongodb-java-spring-boot-csfle/blob/main/src/main/java/com/mongodb/quickstart/javaspringbootcsfle/repository/PersonRepository.java)

```java
/**
 * Spring Data MongoDB repository for the PersonEntity
 */
@Repository
public interface PersonRepository extends MongoRepository<PersonEntity, String> {

    PersonEntity findFirstBySsn(String ssn);
}
```


## Wrap Up

Thanks for reading my blog post this far!

If you have any questions about it, please feel free to open a question in the GitHub repository or ask a question in
the [MongoDB Community Forum](https://www.mongodb.com/community/forums/c/data/java-frameworks/164).

Feel free to ping me directly in your post: [@MaBeuLux88](https://www.mongodb.com/community/forums/u/mabeulux88/summary).

Pull requests and improvement ideas are very welcome!


[1]: https://images.contentstack.io/v3/assets/blt39790b633ee0d5a7/blt18b620b3a7148e9c/6540f193d889b6001bb9d335/Spring-Data-MongoDB-CSFLE.png
[2]: https://images.contentstack.io/v3/assets/blt39790b633ee0d5a7/bltc4a595f6e34a630a/6540f19336795e040703d335/Controller-Service-Repos.png
