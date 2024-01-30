# Java 21: Unlocking the Power of the MongoDB Java Driver with Virtual Threads.

## Introduction

Greetings, Dev Community! Java 21 is here, and if you're using the MongoDB Java Driver, this is a ride you won't want to
miss! Increased performances and non-blocking threads are on the menu today! 🚀

In this blog post, we're going to take a stroll through some of the key features of Java 21 that are not just exciting
for Java devs in general but are particularly juicy for those of us pushing the boundaries with MongoDB.

# JDK 21

To begin with, let's have a look to all the features released in Java 21, also known
as [JDK Enhancement Proposal](https://en.wikipedia.org/wiki/JDK_Enhancement_Proposal) (JEP).

- [JEP 430: String Templates (Preview)](https://openjdk.org/jeps/430)
- [JEP 431: Sequenced Collections](https://openjdk.org/jeps/431)
- [JEP 439: Generational ZGC](https://openjdk.org/jeps/439)
- [JEP 440: Record Patterns](https://openjdk.org/jeps/440)
- [JEP 441: Pattern Matching for switch](https://openjdk.org/jeps/441)
- [JEP 442: Foreign Function & Memory API (Third Preview)](https://openjdk.org/jeps/442)
- [JEP 443: Unnamed Patterns and Variables (Preview)](https://openjdk.org/jeps/443)
- [JEP 444: Virtual Threads](https://openjdk.org/jeps/444)
- [JEP 445: Unnamed Classes and Instance Main Methods (Preview)](https://openjdk.org/jeps/445)
- [JEP 446: Scoped Values (Preview)](https://openjdk.org/jeps/446)
- [JEP 448: Vector API (Sixth Incubator)](https://openjdk.org/jeps/448)
- [JEP 449: Deprecate the Windows 32-bit x86 Port for Removal](https://openjdk.org/jeps/449)
- [JEP 451: Prepare to Disallow the Dynamic Loading of Agents](https://openjdk.org/jeps/451)
- [JEP 452: Key Encapsulation Mechanism API](https://openjdk.org/jeps/452)
- [JEP 453: Structured Concurrency (Preview)](https://openjdk.org/jeps/453)

## The Project Loom & MongoDB Java Driver 4.11

While some of them, like deprecations, might not be the most exciting, some of them are more interesting, particularly
these 3 JEPs.

- [JEP 444: Virtual Threads](https://openjdk.org/jeps/444)
- [JEP 453: Structured Concurrency (Preview)](https://openjdk.org/jeps/453)
- [JEP 446: Scoped Values (Preview)](https://openjdk.org/jeps/446)

Let's discuss a bit more about them.

These 3 JEPs are closely related to the [Project Loom](https://wiki.openjdk.org/display/loom/Main) which is an
initiative within the Java
ecosystem that introduces lightweight threads
called [virtual threads](https://docs.oracle.com/en/java/javase/21/core/virtual-threads.html). These virtual threads
simplify concurrent programming, providing a more scalable and efficient alternative to traditional heavyweight threads.

With Project Loom, developers can create thousands of virtual threads without the
typical performance overhead, making it easier to write concurrent code. Virtual threads offer improved resource
utilization and simplify code maintenance, providing a more accessible approach to managing concurrency in Java
applications. The project aims to enhance the developer experience by reducing the complexities associated with thread
management while optimizing performance.

> Since the [version 4.11](https://www.mongodb.com/docs/drivers/java/sync/current/whats-new/#new-features-in-4.11) of
> the
> MongoDB java driver, [virtual threads](https://docs.oracle.com/en/java/javase/21/core/virtual-threads.html) are fully
> supported.

If you want more details, you can read [this epic in the MongoDB Jira](https://jira.mongodb.org/browse/JAVA-4649) which
explains the motivations of this support.

You can also read more about the Java
driver [new features](https://www.mongodb.com/docs/drivers/java/sync/current/whats-new/)
and [compatibility](https://www.mongodb.com/docs/drivers/java/sync/current/compatibility/).

## Spring Boot & Virtual Threads

In Spring Boot 3.2.0+, you just have to add the following property in your `application.properties` file
to enable virtual threads.

```properties
spring.threads.virtual.enabled=true
```

It's **huge** because this means that your access to MongoDB resources are now non-blocking - thanks to virtual threads.

This is going to improve dramatically the performances of your back-end. Managing a large workload is now easier as all
the threads are now non-blocking by default and the overhead of the context switching for the platform threads is almost
free.

You can read this [blog post from Dan Vega](https://www.danvega.dev/blog/virtual-threads-spring-boot) to learn more
about Spring boot and virtual threads.

## Conclusion

Java 21's recent release has unleashed exciting features for MongoDB Java Driver users, particularly with the
introduction of virtual threads. Since version 4.11, these lightweight threads offer a streamlined approach to
concurrent programming, enhancing scalability and efficiency.

For Spring Boot enthusiasts, embracing virtual threads is a game-changer for backend performance, making MongoDB
interactions non-blocking by default.

Curious to experience these advancements? Dive into the future of Java development and explore MongoDB with Spring Boot
using
the [Java Spring Boot MongoDB Starter in GitHub]( https://github.com/mongodb-developer/java-spring-boot-mongodb-starter).

If you don't have one already, claim your free MongoDB cluster
in [MongoDB Atlas](https://www.mongodb.com/atlas/database) to get started with the above repository faster.

Any burning question? Come chat with us in the [MongoDB Community Forums](https://www.mongodb.com/community/forums/).

Happy coding! 🚀
