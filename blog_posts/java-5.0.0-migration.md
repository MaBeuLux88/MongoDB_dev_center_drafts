# Java Driver - Migrating from 4.11 to 5.0

## Introduction

The MongoDB Java Driver 5.0.0 is now available!

While this version doesn't include many new features, it's removing a lot of deprecated methods and is preparing for the
future.

## New Features

You can
read [the full list of new features](https://www.mongodb.com/docs/drivers/java/sync/upcoming/whats-new/#what-s-new-in-5.0)
but here is a summary.

### getElapsedTime()

The behaviour of the method `getElapsedTime()` was modified in the following classes:

```text
com.mongodb.event.ConnectionReadyEvent
com.mongodb.event.ConnectionCheckedOutFailedEvent
com.mongodb.event.ConnectionCheckedOutEvent
```

If you are using one of these methods, make sure to recompile and
to [read the details](https://www.mongodb.com/docs/drivers/java/sync/current/whats-new/#std-label-version-5.0).

### Scala

The `org.mongodb.scala.Observable.completeWithUnit()` method is deprecated.

## Breaking Changes

You can read [the full list of breaking changes](https://www.mongodb.com/docs/drivers/java/sync/current/upgrade/#version-5.0-breaking-changes) but here is a summary.

### ConnectionId

In 4.11, the class `ConnectionId` was using integers.

```java
@Immutable
public final class ConnectionId {
    private static final AtomicInteger INCREMENTING_ID = new AtomicInteger();

    private final ServerId serverId;
    private final int localValue;
    private final Integer serverValue;
    private final String stringValue;

    // ...
}
```

```java

@Immutable
public final class ConnectionId {
    private static final AtomicLong INCREMENTING_ID = new AtomicLong();
    private final ServerId serverId;
    private final long localValue;
    @Nullable
    private final Long serverValue;
    private final String stringValue;

// ...
```

While this should have a very minor impact in your code, it's breaking binary and source compatibility. Make sure to
rebuild your binary and you should be good to go.

### Package update

Three record annotations moved from:

```text
org.bson.codecs.record.annotations.BsonId
org.bson.codecs.record.annotations.BsonProperty
org.bson.codecs.record.annotations.BsonRepresentation
```

To:

```text
org.bson.codecs.pojo.annotations.BsonId
org.bson.codecs.pojo.annotations.BsonProperty
org.bson.codecs.pojo.annotations.BsonRepresentation
```

So if you are using these annotations, please make sure to update the imports and rebuild.

### SocketSettings is now using long

The first parameters of the two following builder methods in `SocketSettings` are now using a long instead of an
integer.

```java
public Builder connectTimeout(final long connectTimeout, final TimeUnit timeUnit) {/*...*/}
public Builder readTimeout ( final long readTimeout, final TimeUnit timeUnit){/*...*/}
```

This breaks binary compatibility but shouldn't require a code change in your code.

### Filters.eqFull()

`Filters.eqFull()` was only released in `Beta` for vector search. It's now deprecated. Use `Filters.eq()` instead when
instantiating a `VectorSearchOptions`.

```java
VectorSearchOptions opts = vectorSearchOptions().filter(eq("x", 8));
```

### ClusterConnectionMode

The way the driver is computing the `ClusterConnectionMode` is now more consistent by using a specified replica set
name, regardless of how it's configured.

In the following example, both the 4.11 and 5.0.0 drivers were returning the same
thing: `ClusterConnectionMode.MULTIPLE`.

```java
ClusterSettings.builder()
  .applyConnectionString(new ConnectionString("mongodb://127.0.0.1:27017/?replicaSet=replset"))
  .build()
  .getMode();
```

But in this example, the 4.11 driver was returning `ClusterConnectionMode.SINGLE` instead
of `ClusterConnectionMode.MULTIPLE`.

```java
ClusterSettings.builder()
  .hosts(Collections.singletonList(new ServerAddress("127.0.0.1", 27017)))
  .requiredReplicaSetName("replset")
  .build()
  .getMode();
```

### BsonDecimal128

The behaviour of `BsonDecimal128` is now more consistent with the behaviour of `Decimal128`.

```java
BsonDecimal128.isNumber(); // returns true
BsonDecimal128.asNumber(); // returns the BsonNumber
```

## All the Jira tickets for 5.0.0

There are more updates in 5.0.0, so take a look at the Jira tickets for more details.

### Majors

- [JAVA-3897](https://jira.mongodb.org/browse/JAVA-3897) - Wrong type for ClusterSettings.Builder#connectTimeOut and readTimeout parameter
- [JAVA-4144](https://jira.mongodb.org/browse/JAVA-4144) - Remove slaveOK connection string option from URI parsing
- [JAVA-4353](https://jira.mongodb.org/browse/JAVA-4353) - Support authorizedCollections option for listCollections helpers
- [JAVA-4754](https://jira.mongodb.org/browse/JAVA-4754) - Add log messages to Server selection spec
- [JAVA-5143](https://jira.mongodb.org/browse/JAVA-5143) - Remove deprecated Parameterizable interface
- [JAVA-5161](https://jira.mongodb.org/browse/JAVA-5161) - Remove deprecated Stream-related types
- [JAVA-5162](https://jira.mongodb.org/browse/JAVA-5162) - Reenable deprecation warnings
- [JAVA-5215](https://jira.mongodb.org/browse/JAVA-5215) - Migrate bson module tests from Junit 4 to 5
- [JAVA-5292](https://jira.mongodb.org/browse/JAVA-5292) - Custom codec not found required by data class in list

### Minors

- [JAVA-4303](https://jira.mongodb.org/browse/JAVA-4303) - Improve map/flatmap of Publisher[Void]
- [JAVA-4791](https://jira.mongodb.org/browse/JAVA-4791) - Remove legacy shell from test scripts
- [JAVA-4846](https://jira.mongodb.org/browse/JAVA-4846) - ConnectionId returned in heartbeats may be int64
- [JAVA-4937](https://jira.mongodb.org/browse/JAVA-4937) - Remove deprecated ServerAddress methods
- [JAVA-5088](https://jira.mongodb.org/browse/JAVA-5088) - ClusterSettings does not compute ClusterConnectionMode consistently
- [JAVA-5121](https://jira.mongodb.org/browse/JAVA-5121) - Relax the CMAP documentation requirement for durations in events
- [JAVA-5158](https://jira.mongodb.org/browse/JAVA-5158) - Make NettyStreamFactoryFactory implement AutoCloseable
- [JAVA-5180](https://jira.mongodb.org/browse/JAVA-5180) - Remove Stream#supportsAdditionalTimeout
- [JAVA-5204](https://jira.mongodb.org/browse/JAVA-5204) - Remove unused remnants of OP_REPLY
- [JAVA-5217](https://jira.mongodb.org/browse/JAVA-5217) - Remove getCluster method from ClusterAwareReadWriteBinding
- [JAVA-5235](https://jira.mongodb.org/browse/JAVA-5235) - Pull mongohouse image from ADL ECR repo
- [JAVA-5265](https://jira.mongodb.org/browse/JAVA-5265) - Java driver throws exception for asNumber for BsonDecimal128

### Improvements

- [JAVA-4843](https://jira.mongodb.org/browse/JAVA-4843) - Preserve error code, code name, and error labels when redacting command monitoring/logging
- [JAVA-5072](https://jira.mongodb.org/browse/JAVA-5072) - Driver Container and Kubernetes Awareness
- [JAVA-5116](https://jira.mongodb.org/browse/JAVA-5116) - Remove deprecated helper for collStats command
- [JAVA-5141](https://jira.mongodb.org/browse/JAVA-5141) - Remove deprecated record annotations
- [JAVA-5142](https://jira.mongodb.org/browse/JAVA-5142) - Remove deprecated codecs
- [JAVA-5144](https://jira.mongodb.org/browse/JAVA-5144) - Remove deprecated constructors and factory methods
- [JAVA-5145](https://jira.mongodb.org/browse/JAVA-5145) - Remove deprecated methods in read preference classes
- [JAVA-5149](https://jira.mongodb.org/browse/JAVA-5149) - Remove deprecated mapReduce options
- [JAVA-5150](https://jira.mongodb.org/browse/JAVA-5150) - Remove deprecated methods for oplogReplay option on find
- [JAVA-5151](https://jira.mongodb.org/browse/JAVA-5151) - Remove deprecated event-related classes
- [JAVA-5152](https://jira.mongodb.org/browse/JAVA-5152) - Remove deprecated methods supporting geoHaystack/geoSearch
- [JAVA-5153](https://jira.mongodb.org/browse/JAVA-5153) - Remove deprecated methods in WriteConcernError class
- [JAVA-5154](https://jira.mongodb.org/browse/JAVA-5154) - Remove deprecation of DBCursor#explain
- [JAVA-5159](https://jira.mongodb.org/browse/JAVA-5159) - Refactor batch cursors
- [JAVA-5174](https://jira.mongodb.org/browse/JAVA-5174) - Remove Filters.eqFull
- [JAVA-5276](https://jira.mongodb.org/browse/JAVA-5276) - Ability to configure BsonConfiguration for default KotlinSerializerCodecProvider
- [JAVA-5284](https://jira.mongodb.org/browse/JAVA-5284) - Backport BatchCursorFlux default onErrorDropped hook warning fix

## Conclusion

With the release of MongoDB Java Driver 5.0.0, it's evident that the focus has been on refining existing functionalities, removing deprecated methods, and ensuring compatibility for future enhancements. While the changes may necessitate some adjustments in your codebase, they pave the way for a more robust and efficient development experience.

Ready to upgrade? Dive into the latest version of the [MongoDB Java Drivers](https://www.mongodb.com/docs/drivers/java-drivers/) and start leveraging its enhanced capabilities today!

To finish with, don't forget to enable virtual threads in your Spring Boot 3.2.0+ projects! You just need to add this in your `application.properties` file:

```properties
spring.threads.virtual.enabled=true
```

Got questions or itching to share your success? Head over to the [MongoDB Community Forum](https://www.mongodb.com/community/forums/) – we're all ears and ready to help!
