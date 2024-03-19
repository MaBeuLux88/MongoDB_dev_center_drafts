# Optimizing Java Performance with Virtual Threads, Reactive Programming, and MongoDB

## Introduction

When I first heard about the [project Loom](https://wiki.openjdk.org/display/loom/Main) and [virtual threads](https://docs.oracle.com/en/java/javase/21/core/virtual-threads.html), my first thought was that this was a death sentence for
[reactive programming](https://www.baeldung.com/cs/reactive-programming). It wasn't bad news at first because reactive programming comes with its additional layer of
complexity and using imperative programming without wasting resources was music to my ears.

But I was actually wrong and a bit more reading and learning helped me understand why thinking this was a mistake.

In this post, we'll explore virtual threads and reactive programming, their differences and how we can leverage both in
the same project to achieve peak concurrency performance in Java.

Learn more about [virtual threads support with MongoDB](https://www.mongodb.com/developer/products/mongodb/jdk-21-virtual-threads/) in my previous post on this topic.

## Virtual Threads

### Traditional Thread Model in Java

In traditional Java concurrency, threads are heavyweight entities managed by the operating system. Each OS
thread is wrapped by a platform thread which is managed by the Java Virtual Machine (JVM) that executes the Java code.

Each thread requires significant system resources, leading to limitations in scalability when dealing with a
large number of concurrent tasks. Context switching between threads is also resource intensive and can deteriorate the
performance.

### Introducing Virtual Threads

Virtual threads, introduced by the [Project Loom](https://wiki.openjdk.org/display/loom/Main) in the [JEP 444](https://openjdk.org/jeps/444), are lightweight by
design and aim to overcome the limitations of traditional threads and create high-throughput concurrent applications.
They implement `java.lang.Thread` and they are managed by the JVM. Several of them can
run on the same platform thread, making them more efficient to work with a large number of small concurrent tasks.

### Benefits of Virtual Threads

Virtual threads allow the Java developer to use the system resources more efficiently and non-blocking I/O.

But with the closely related [JEP 453: Structured Concurrency](https://openjdk.org/jeps/453) and [JEP 446: Scoped Values](https://openjdk.org/jeps/446),
virtual threads also support structured concurrency to treat a group of related tasks as a single unit of work and
divide a task into smaller independent subtasks to improve response time and throughput.

### Example

Here is a basic Java example.

```java
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class VirtualThreadsExample {

    public static void main(String[] args) {
        try (ExecutorService virtualExecutor = Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 0; i < 10; i++) {
                int taskNumber = i + 1;
                Runnable task = () -> taskRunner(taskNumber);
                virtualExecutor.submit(task);
            }
        }
    }

    private static void taskRunner(int number) {
        System.out.println("Task " + number + " executed by virtual thread: " + Thread.currentThread());
    }
}
```

Output of this program:

```
Task 6 executed by virtual thread: VirtualThread[#35]/runnable@ForkJoinPool-1-worker-6
Task 2 executed by virtual thread: VirtualThread[#31]/runnable@ForkJoinPool-1-worker-2
Task 10 executed by virtual thread: VirtualThread[#39]/runnable@ForkJoinPool-1-worker-10
Task 1 executed by virtual thread: VirtualThread[#29]/runnable@ForkJoinPool-1-worker-1
Task 5 executed by virtual thread: VirtualThread[#34]/runnable@ForkJoinPool-1-worker-5
Task 7 executed by virtual thread: VirtualThread[#36]/runnable@ForkJoinPool-1-worker-7
Task 4 executed by virtual thread: VirtualThread[#33]/runnable@ForkJoinPool-1-worker-4
Task 3 executed by virtual thread: VirtualThread[#32]/runnable@ForkJoinPool-1-worker-3
Task 8 executed by virtual thread: VirtualThread[#37]/runnable@ForkJoinPool-1-worker-8
Task 9 executed by virtual thread: VirtualThread[#38]/runnable@ForkJoinPool-1-worker-9
```

We can see that the tasks ran in parallel. Each in a different virtual thread, managed by a single `ForkJoinPool` and
its associated workers.

## Reactive Programming

First of all, [reactive programming](https://www.reactivemanifesto.org/) is a programming paradigm when virtual threads
are "just" a technical solution. Reactive Programming revolves around asynchronous and event-driven programming
principles, offering solutions to manage streams of data and asynchronous operations efficiently.

In Java, reactive programming is traditionally implemented with
the [observer pattern](https://en.wikipedia.org/wiki/Observer_pattern).

The pillars of reactive programming are:

- Non-blocking I/O.
- Stream bases asynchronous communication.
- Back-pressure handling: prevent overwhelming downstream components with more data than they can handle.

The only common point of interest with virtual threads is the first one: non-blocking I/O.

### Reactive Programming Frameworks

The main frameworks in Java that follow the reactive programming principles are:

- [Reactive Streams](https://www.reactive-streams.org/): provides a standard for asynchronous stream processing with
  non-blocking back pressure
- [RxJava](https://github.com/ReactiveX/RxJava): JVM implementation of [Reactive Extensions](http://reactivex.io/)
- [Project Reactor](https://spring.io/reactive): foundation of the reactive stack in the Spring ecosystem.

### Example

MongoDB also offers an implementation of the [Reactive Streams API](http://www.reactive-streams.org/):
the [MongoDB Reactive Streams Driver](https://mongodb.github.io/mongo-java-driver/5.0/driver-reactive/).

Here is an example where I insert a document in MongoDB and then retrieve it.

```java
import com.mongodb.client.result.InsertOneResult;
import com.mongodb.quickstart.SubscriberHelpers.OperationSubscriber;
import com.mongodb.quickstart.SubscriberHelpers.PrintDocumentSubscriber;
import com.mongodb.reactivestreams.client.MongoClient;
import com.mongodb.reactivestreams.client.MongoClients;
import com.mongodb.reactivestreams.client.MongoCollection;
import org.bson.Document;

public class MongoDBReactiveExample {

    public static void main(String[] args) {
        try (MongoClient mongoClient = MongoClients.create("mongodb://localhost")) {
            MongoCollection<Document> coll = mongoClient.getDatabase("test").getCollection("testCollection");

            Document doc = new Document("reactive", "programming");

            var insertOneSubscriber = new OperationSubscriber<InsertOneResult>();
            coll.insertOne(doc).subscribe(insertOneSubscriber);
            insertOneSubscriber.await();

            var printDocumentSubscriber = new PrintDocumentSubscriber();
            coll.find().first().subscribe(printDocumentSubscriber);
            printDocumentSubscriber.await();
        }
    }
}
```

> Note: The `SubscriberHelpers.OperationSubscriber` and `SubscriberHelpers.PrintDocumentSubscriber` classes come from
> the [Reactive Streams Quick Start Primer](https://mongodb.github.io/mongo-java-driver/5.0/driver-reactive/getting-started/quick-start-primer/).
> You can find
> the [SubscriberHelpers.java](https://github.com/mongodb/mongo-java-driver/blob/master/driver-reactive-streams/src/examples/reactivestreams/helpers/SubscriberHelpers.java)
> in the [MongoDB Java Driver repository](https://github.com/mongodb/mongo-java-driver) code examples.

## Virtual Threads and Reactive Programming Working Together

As you might have understood, virtual threads and reactive programming aren't competing against each other, and they
certainly agree on one thing: blocking I/O operations are evil!

Who said that we had to make a choice? Why not use them both to achieve peak performance and prevent blocking I/Os once
and for all?

Good news, the `reactor-core`
library [added virtual threads support in 3.6.0](https://spring.io/blog/2023/10/31/what-new-is-coming-in-reactor-core-3-6-0). [Project Reactor](https://projectreactor.io/)
is the library that provides a rich and functional implementation of `Reactive Streams APIs`
in [Spring Boot](https://spring.io/projects/spring-boot)
and [WebFlux](https://docs.spring.io/spring-framework/reference/web/webflux.html).

This means that we can use virtual threads in a Spring Boot project that is using MongoDB Reactive Streams Driver and
Webflux.

There are a few conditions though:

- Use Tomcat because - as I'm writing this post - [Netty](https://netty.io/) (used by default by Webflux)
  doesn't support virtual threads. See [here](https://github.com/netty/netty/issues/12848)
  and [there](https://github.com/spring-projects/spring-boot/issues/39425) for more details.
- Activate virtual threads: `spring.threads.virtual.enabled=true` in `application.properties`.

### Let's Test

In [this repository](https://github.com/mongodb-developer/mdb-spring-boot-reactive), my colleague Wen Jie Teo and I
updated the `pom.xml` and `application.properties` so we could use virtual threads in this reactive project.

You can run the following commands to get this project running quickly and test that it's running with virtual threads
correctly. You can get more details in the
[README.md](https://github.com/mongodb-developer/mdb-spring-boot-reactive/blob/main/README.md) file but here is a gist.

Here are the instructions in English:

- Clone the repository and access the folder.
- Update the log level in `application.properties` to `info`.
- Start a local MongoDB single node replica set instance or use [MongoDB Atlas](https://www.mongodb.com/atlas/database).
- Run the `setup.js` script to initialize the `accounts` collection.
- Start the Java application.
- Test one of the APIs available.

Here are the instructions translated in Bash.

First terminal:

```shell
git clone git@github.com:mongodb-developer/mdb-spring-boot-reactive.git
cd mdb-spring-boot-reactive/
sed -i 's/warn/info/g' src/main/resources/application.properties
docker run --rm -d -p 27017:27017 -h $(hostname) --name mongo mongo:latest --replSet=RS && sleep 5 && docker exec mongo mongosh --quiet --eval "rs.initiate();"
mongosh --file setup.js
mvn spring-boot:run
```

> Note: On macOS, you may have to use `sed -i '' 's/warn/info/g' src/main/resources/application.properties` if you are not using `gnu-sed` or you can just edit the final manually.

Second terminal

```shell
curl 'localhost:8080/account' -H 'Content-Type: application/json' -d '{"accountNum": "1"}'
```

If everything worked as planned, you should see this line in the first terminal (where you are running Spring).

```
Stack trace's last line: java.base/java.lang.VirtualThread.run(VirtualThread.java:309) from POST /account
```

Which is the last line in the stack trace that we are logging. It proves that we are using virtual thread to handle
our query.

If we disable the virtual threads in the `application.properties` file and try again, we'll read instead:

```
Stack trace's last line: java.base/java.lang.Thread.run(Thread.java:1583) from POST /account
```

This time, we are using a classic `java.lang.Thread` instance to handle our query.

## Conclusion

Virtual threads and reactive programming are not mortal enemies. The truth is actually far from that.

The combination of virtual threads advantages over standard platform threads with the best practices of reactive
programming opens up new frontiers of scalability, responsiveness, and efficient resource utilization for your
applications. Be gone blocking I/Os!

[MongoDB Reactive Streams Driver](https://mongodb.github.io/mongo-java-driver/5.0/driver-reactive/) is fully equipped to
benefit from both virtual threads optimizations with Java 21, and - as always - benefit from the reactive programming
principles and best practices.

I hope this post motivated you to give it a try. Deploy your cluster on
[MongoDB Atlas](https://www.mongodb.com/atlas/database) and give the
[repository](https://github.com/mongodb-developer/mdb-spring-boot-reactive) a spin.

For further guidance, support, and to engage with a vibrant community of developers, head over to the
[MongoDB Forum](https://www.mongodb.com/community/forums/) where you can find help, share insights, and ask those
burning questions. Let's continue pushing the boundaries of Java development together!
