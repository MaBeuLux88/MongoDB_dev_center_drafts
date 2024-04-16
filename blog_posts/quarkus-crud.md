# Creating A REST API For CRUD Operations With Quarkus And MongoDB

## What is Quarkus

When we write a traditional Java application, our Java source code is compiled and transformed into Java bytecode.
This bytecode can then be executed by a Java Virtual Machine (JVM) specific to the operating system you are
running. This is why we can say that Java is a portable language. You compile once, and you can run it everywhere,
as long as you have the right JVM on the right machine.

This is a great mechanism, but it's comes at a cost. Starting a program is slow because the JVM and the entire context
needs to be loaded first before running anything, and it's not memory efficient because we need to run an entire JVM for
maybe just ten lines of code.

This was perfectly fine in the old monolithic realm, but this is totally unacceptable in the new world made of lambda
functions, cloud, containers and Kubernetes. In this context, a low memory footprint and a lightning fast startup time
are absolutely mandatory.

This is where [Quarkus](https://quarkus.io/about/) comes in. Quarkus is a Kubernetes-native Java framework tailored
for [GraalVM](https://www.graalvm.org/) and [HotSpot](https://en.wikipedia.org/wiki/HotSpot_(virtual_machine)).

With Quarkus you can build native binaries that can boot and send their first response in 0.042 seconds versus 9.5
seconds for a traditional Java application.

![Quarkus startup time](https://images.contentstack.io/v3/assets/blt39790b633ee0d5a7/bltc34b97d1a8137f01/661dddb79cbc2a964ea9cc2a/quarkus.png)

In this tutorial, we are going to build a Quarkus application that can manage a `persons` collection in MongoDB. The
goal is to perform four simple CRUD operations with a REST API using a native application.

## Prerequisites

For this tutorial you'll need:

- [Docker](https://docs.docker.com/engine/install/)
- [GraalVM](https://www.graalvm.org/latest/docs/getting-started/)
- A [MongoDB Atlas](https://www.mongodb.com/atlas/database) cluster or a local instance. I'll use a Docker container in
  this tutorial.

If you don't want to code along and prefer to check out directly the final code:

```bash
git clone git@github.com:mongodb-developer/quarkus-mongodb-crud.git
```

## How to set up Quarkus with MongoDB

**TL;DR**:
Use [this link](https://code.quarkus.io/?g=com.mongodb&a=quarkus-mongodb-crud&e=mongodb-client&e=smallrye-openapi&e=rest&e=rest-jackson)
and click on `generate your application` or clone
the [GitHub repository](https://github.com/mongodb-developer/quarkus-mongodb-crud).

The easiest way to get your project up and running with Quarkus and all the dependencies you need is to
use [https://code.quarkus.io/](https://code.quarkus.io/).

Very much like [https://start.spring.io/](https://start.spring.io/), the Quarkus project starter website will help you
select your dependencies and build your Maven or Gradle configuration file. Some dependencies will also include a
starter code to assist you in your first steps.

For our project, we are going to need:

- MongoDB client [quarkus-mongodb-client]
- SmallRye OpenAPI [quarkus-smallrye-openapi]
- REST [quarkus-rest]
- REST Jackson [quarkus-rest-jackson]

Feel free to use the `group` and `artifact` of your choice. Make sure the Java version matches the version of your
GraalVM version, and we are ready to go.

Download the zip file and unzip it in your favorite project folder. Once it's done, take some time to read the README.md
file provided.

Finally, we need a MongoDB cluster. Two solutions:

- Create a new cluster on [MongoDB Atlas](https://www.mongodb.com/atlas/database) and retrieve the connection string.
- Create an ephemeral single node replica set with Docker.

```bash
docker run --rm -d -p 27017:27017 -h $(hostname) --name mongo mongo:latest --replSet=RS && sleep 5 && docker exec mongo mongosh --quiet --eval "rs.initiate();"
```

Either way, the next step is to set up your connection string in the `application.properties` file.

```properties
quarkus.mongodb.connection-string=mongodb://localhost:27017
```

## CRUD operations in Quarkus with MongoDB

Now that our Quarkus project is ready, we can start developing.

First, we can start the developer mode which includes a live coding (automatic refresh) without the need to restart the
program.

```bash
./mvnw compile quarkus:dev
```

This developer mode comes with two handy features:

- [Swagger UI](http://localhost:8080/q/swagger-ui/#/)
- [Quarkus Dev UI](http://localhost:8080/q/dev/)

Also, as your service is now running, you should be able to receive your first HTTP communication:

```bash
curl http://localhost:8080/hello
```

Result:

```
Hello from Quarkus REST
```

This works because your project currently contains a single class `GreetingResource.java` with the following code.

```java
package com.mongodb;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/hello")
public class GreetingResource {

    @GET
    @Produces(MediaType.TEXT_PLAIN)
    public String hello() {
        return "Hello from Quarkus REST";
    }
}
```

### PersonEntity

"Hello from Quarkus REST" is nice, but it's not our goal! We want to manipulate data from a `persons` collection in
MongoDB.

Let's create a classic `PersonEntity.java` [POJO](https://en.wikipedia.org/wiki/Plain_old_Java_object) class. I created
it in the default `com.mongodb` package which is my `group` from earlier. Feel free to change it.

```java
package com.mongodb;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import org.bson.types.ObjectId;

import java.util.Objects;

public class PersonEntity {

    @JsonSerialize(using = ToStringSerializer.class)
    public ObjectId id;
    public String name;
    public Integer age;

    public PersonEntity() {
    }

    public PersonEntity(ObjectId id, String name, Integer age) {
        this.id = id;
        this.name = name;
        this.age = age;
    }

    @Override
    public int hashCode() {
        int result = id != null ? id.hashCode() : 0;
        result = 31 * result + (name != null ? name.hashCode() : 0);
        result = 31 * result + (age != null ? age.hashCode() : 0);
        return result;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        PersonEntity that = (PersonEntity) o;

        if (!Objects.equals(id, that.id)) return false;
        if (!Objects.equals(name, that.name)) return false;
        return Objects.equals(age, that.age);
    }

    public ObjectId getId() {
        return id;
    }

    public void setId(ObjectId id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getAge() {
        return age;
    }

    public void setAge(Integer age) {
        this.age = age;
    }
}
```

We now have a class to map our MongoDB documents to using [Jackson](https://github.com/FasterXML/jackson).

### PersonRepository

Now that we have a `PersonEntity` we can create a `PersonRepository` template, ready to welcome our CRUD queries.

Create a `PersonRepository.java` class next to the `PersonEntity.java` one.

```java
package com.mongodb;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoCollection;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class PersonRepository {

    private final MongoClient mongoClient;
    private final MongoCollection<PersonEntity> coll;

    public PersonRepository(MongoClient mongoClient) {
        this.mongoClient = mongoClient;
        this.coll = mongoClient.getDatabase("test").getCollection("persons", PersonEntity.class);
    }

    // CRUD methods will go here

}
```

### PersonResource

We are now almost ready to create our first CRUD method. Let's update the default `GreetingResource.java` class to match
our goal.

1. Rename the file `GreetingResource.java` to `PersonResource.java`.
2. In the `test` folder, also rename the default test files to `PersonResourceIT.java` and `PersonResourceTest.java`.
3. Update `PersonResource.java` like this:

```java
package com.mongodb;

import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

@Path("/api")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class PersonResource {

    @Inject
    PersonRepository personRepository;

    @GET
    @Path("/hello")
    public String hello() {
        return "Hello from Quarkus REST";
    }

    // CRUD routes will go here

}
```

> Note that with the `@Path("/api")` annotation, the URL of our `/hello` service is now `/api/hello`.

As a consequence, update `PersonResourceTest.java` so our test keeps working.

```java
package com.mongodb;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;

@QuarkusTest
class PersonResourceTest {
    @Test
    void testHelloEndpoint() {
        given().when().get("/api/hello").then().statusCode(200).body(is("Hello from Quarkus REST"));
    }
}
```

### Create a person

All the pieces are now in place. We can create our first route to be able to create a new person.

In
the [repository](https://github.com/mongodb-developer/quarkus-mongodb-crud/blob/main/src/main/java/com/mongodb/PersonRepository.java),
add the following method that inserts a `PersonEntity` and returns the inserted document's `ObjectId` in `String`
format.

```java
public String add(PersonEntity person) {
    return coll.insertOne(person).getInsertedId().asObjectId().getValue().toHexString();
}
```

In
the [resource](https://github.com/mongodb-developer/quarkus-mongodb-crud/blob/main/src/main/java/com/mongodb/PersonResource.java)
file, we can create the corresponding route:

```java

@POST
@Path("/person")
public String createPerson(PersonEntity person) {
    return personRepository.add(person);
}
```

Without restarting the project (remember the dev mode?), you should be able to test this route.

```bash
curl -X POST http://localhost:8080/api/person \
     -H 'Content-Type: application/json' \
     -d '{"name": "John Doe", "age": 30}'
```

Which should return the `ObjectId` of the new `person` document.

```
661dccf785cd323349ca42f7
```

If you connect to the MongoDB instance with [mongosh](https://www.mongodb.com/docs/mongodb-shell/), you can confirm that
the document made it:

```
RS [direct: primary] test> db.persons.find()
[
  {
    _id: ObjectId('661dccf785cd323349ca42f7'),
    age: 30,
    name: 'John Doe'
  }
]
```

### Read persons

Now we can read all the persons in the database for example.

In
the [repository](https://github.com/mongodb-developer/quarkus-mongodb-crud/blob/main/src/main/java/com/mongodb/PersonRepository.java)
add:

```java
public List<PersonEntity> getPersons() {
    return coll.find().into(new ArrayList<>());
}
```

In
the [resource](https://github.com/mongodb-developer/quarkus-mongodb-crud/blob/main/src/main/java/com/mongodb/PersonResource.java)
add:

```java

@GET
@Path("/persons")
public List<PersonEntity> getPersons() {
    return personRepository.getPersons();
}
```

And now we can retrieve all the persons in our database:

```bash
curl http://localhost:8080/api/persons
```

Which returns a list of persons:

```json
[
  {
    "id": "661dccf785cd323349ca42f7",
    "name": "John Doe",
    "age": 30
  }
]
```

### Update person

It's John Doe's anniversary! Let's increment his age by one.

In
the [repository](https://github.com/mongodb-developer/quarkus-mongodb-crud/blob/main/src/main/java/com/mongodb/PersonRepository.java)
add:

```java
public long anniversaryPerson(String id) {
    Bson filter = eq("_id", new ObjectId(id));
    Bson update = inc("age", 1);
    return coll.updateOne(filter, update).getModifiedCount();
}
```

In
the [resource](https://github.com/mongodb-developer/quarkus-mongodb-crud/blob/main/src/main/java/com/mongodb/PersonResource.java)
add:

```java

@PUT
@Path("/person/{id}")
public long anniversaryPerson(@PathParam("id") String id) {
    return personRepository.anniversaryPerson(id);
}
```

Time to test this party:

```bash
curl -X PUT http://localhost:8080/api/person/661dccf785cd323349ca42f7
```

This returns `1` which is the number of modified document(s). If the provided `ObjectId` doesn't match a person's id,
then it returns `0` and MongoDB doesn't perform any update.

### Delete person

Finally, it's time to delete John Doe...

In
the [repository](https://github.com/mongodb-developer/quarkus-mongodb-crud/blob/main/src/main/java/com/mongodb/PersonRepository.java)
add:

```java
public long deletePerson(String id) {
    Bson filter = eq("_id", new ObjectId(id));
    return coll.deleteOne(filter).getDeletedCount();
}
```

In
the [resource](https://github.com/mongodb-developer/quarkus-mongodb-crud/blob/main/src/main/java/com/mongodb/PersonResource.java)
add:

```java

@DELETE
@Path("/person/{id}")
public long deletePerson(@PathParam("id") String id) {
    return personRepository.deletePerson(id);
}
```

Let's test:

```bash
curl -X DELETE http://localhost:8080/api/person/661dccf785cd323349ca42f7
```

Again, it returns `1` which is the number of deleted document(s).

Now that we have a working Quarkus application with a MongoDB CRUD service, it's time to experience the full
power of Quarkus.

## Quarkus native build

Quit the developer mode by simply hitting the `q` key in the relevant terminal.

It's time to build
the [native executable](https://www.graalvm.org/latest/reference-manual/native-image/guides/build-static-executables/)
that we can use in production with GraalVM and experience the *insanely* fast start up time.

Use this command line to build directly with your local GraalVM and other dependencies.

```bash
./mvnw package -Dnative
```

Or use the Docker image that contains everything you need:

```bash
./mvnw package -Dnative -Dquarkus.native.container-build=true
```

The final result is a native application, ready to be launched, in your `target` folder.

```bash
./target/quarkus-mongodb-crud-1.0.0-SNAPSHOT-runner
```

On my laptop, it starts in **JUST 0.019s**! Remember how much time Spring Boot needs to start an application and respond
to queries for the first time?!

You can read more about how Quarkus makes this miracle a reality in
the [container first documentation](https://quarkus.io/container-first/).

## Conclusion

In this tutorial, we've explored how Quarkus and MongoDB can team up to create a lightning-fast RESTful APIs with CRUD
capabilities.

Now equipped with these insights, you're ready to build blazing-fast APIs with Quarkus, GraalVM and MongoDB. Dive into
the
provided [GitHub repository](https://github.com/mongodb-developer/quarkus-mongodb-crud) for more details.

> If you have questions, please head to our [developer community website](https://community.mongodb.com/) where the
> MongoDB engineers and the MongoDB community will help you build your next big idea with MongoDB.
