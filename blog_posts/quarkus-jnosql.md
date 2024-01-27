# Creating a Java REST API with Quarkus and Eclipse JNoSQL for MongoDB

## Introduction

In this tutorial, you will learn how to create a RESTful API using Quarkus, a framework for building Java applications,
and integrate it with Eclipse JNoSQL to work with MongoDB. We will create a simple API to manage developer records.

Combining Quarkus with Eclipse JNoSQL allows you to work with NoSQL databases using a unified API, making switching
between different NoSQL database systems easier.

## Prerequisites

For this tutorial, you’ll need:

- Java 17.
- Maven.
- A MongoDB cluster.
    - Docker (Option 1)
    - MongoDB Atlas (Option 2)

You can use the following Docker command to start a standalone MongoDB instance:

```shell
docker run --rm -d --name mongodb-instance -p 27017:27017 mongo
```

Or you can use [MongoDB Atlas](https://www.mongodb.com/atlas/database) and try the M0 free tier to deploy your cluster.

## Create a Quarkus project

- Visit the [Quarkus Code Generator](https://code.quarkus.io/).
- Configure your project by selecting the desired options, such as the group and artifact ID.
- Add the necessary dependencies to your project. For this tutorial, we will add:
    - JNoSQL Document MongoDB [quarkus-jnosql-document-mongodb]
    - RESTEasy Reactive [quarkus-resteasy-reactive]
    - RESTEasy Reactive Jackson [quarkus-resteasy-reactive-jackson]
    - OpenAPI [quarkus-smallrye-openapi]
- Generate the project, download the ZIP file, and extract it to your preferred location. Remember that the file
  structure may vary with different Quarkus versions, but this should be fine for the tutorial. The core focus will be
  modifying the `pom.xml` file and source code, which remains relatively consistent across versions. Any minor
  structural differences should be good for your progress, and you can refer to version-specific documentation if needed
  for a seamless learning experience.

At this point, your `pom.xml` file should look like this:

```xml

<dependencies>
    <dependency>
        <groupId>io.quarkus</groupId>
        <artifactId>quarkus-resteasy-reactive-jackson</artifactId>
    </dependency>
    <dependency>
        <groupId>io.quarkiverse.jnosql</groupId>
        <artifactId>quarkus-jnosql-document-mongodb</artifactId>
        <version>1.0.5</version>
    </dependency>
    <dependency>
        <groupId>io.quarkus</groupId>
        <artifactId>quarkus-smallrye-openapi</artifactId>
    </dependency>
    <dependency>
        <groupId>io.quarkus</groupId>
        <artifactId>quarkus-resteasy-reactive</artifactId>
    </dependency>
    <dependency>
        <groupId>io.quarkus</groupId>
        <artifactId>quarkus-arc</artifactId>
    </dependency>
    <dependency>
        <groupId>io.quarkus</groupId>
        <artifactId>quarkus-junit5</artifactId>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>io.rest-assured</groupId>
        <artifactId>rest-assured</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```

By default, [quarkus-jnosql-document-mongodb](https://mvnrepository.com/artifact/io.quarkiverse.jnosql/quarkus-jnosql-document-mongodb)
is in version `1.0.5`, but the latest release is `3.2.2.1`. You should update your `pom.xml` to use the latest version:

```xml
<dependency>
    <groupId>io.quarkiverse.jnosql</groupId>
    <artifactId>quarkus-jnosql-document-mongodb</artifactId>
    <version>3.2.2.1</version>
</dependency>
```

## Database configuration

Before you dive into the implementation, it’s essential to configure your MongoDB database properly. In MongoDB, you
must often set up credentials and specific configurations to connect to your database instance. Eclipse JNoSQL provides
a flexible configuration mechanism that allows you to manage these settings efficiently.

You can find detailed configurations and setups for various databases, including MongoDB, in the [Eclipse JNoSQL GitHub
repository](https://github.com/eclipse/jnosql-databases?tab=readme-ov-file#configuration-10).

To run your application locally, you can configure the database name and properties in your application’s
`application.properties` file. Open this file and add the following line to set the database name:

```properties
quarkus.mongodb.connection-string=mongodb://localhost:27017
jnosql.document.database=school
```

This configuration will enable your application to:
- Use the “school” database.
- Connect to the MongoDB cluster available at the provided connection string.

In production, make sure to enable access control and enforce authentication. See the [security checklist](https://www.mongodb.com/docs/manual/administration/security-checklist/) for more
details.

It’s worth mentioning that Eclipse JNoSQL leverages Eclipse MicroProfile Configuration, which is designed to facilitate
the implementation of [twelve-factor applications](https://12factor.net/), especially in configuration management. It means you can override
properties through environment variables, allowing you to switch between different configurations for development,
testing, and production without modifying your code. This flexibility is a valuable aspect of building robust and easily
deployable applications.

Now that your database is configured, you can proceed with the tutorial and create your RESTful API with Quarkus and
Eclipse JNoSQL for MongoDB.

## Create a developer entity

In this step, we will create a simple `Developer` entity using Java records. Create a new record in the `src/main/java`
directory named `Developer`.

```java
import jakarta.nosql.Column;
import jakarta.nosql.Entity;
import jakarta.nosql.Id;

import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;

@Entity
public record Developer(
@Id String id,
@Column String name,
@Column LocalDate birthday
) {

    public static Developer newDeveloper(String name, LocalDate birthday) {
        Objects.requireNonNull(name, "name is required");
        Objects.requireNonNull(birthday, "birthday is required");
        return new Developer(
                UUID.randomUUID().toString(),
                name,
                birthday);
    }

    public Developer update(String name, LocalDate birthday) {
        Objects.requireNonNull(name, "name is required");
        Objects.requireNonNull(birthday, "birthday is required");
        return new Developer(
                this.id(),
                name,
                birthday);
    }
}
```

## Create a REST API

Now, let’s create a RESTful API to manage developer records. Create a new class in `src/main/java`
named `DevelopersResource`.

```java
import jakarta.inject.Inject;
import jakarta.nosql.document.DocumentTemplate;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.time.LocalDate;
import java.util.List;

@Path("developers")
@Consumes({MediaType.APPLICATION_JSON})
@Produces({MediaType.APPLICATION_JSON})
public class DevelopersResource {

    @Inject
    DocumentTemplate template;

    @GET
    public List<Developer> listAll(@QueryParam("name") String name) {
        if (name == null) {
            return template.select(Developer.class).result();
        }

        return template.select(Developer.class)
                .where("name")
                .like(name)
                .result();
    }

    public record NewDeveloperRequest(String name, LocalDate birthday) {
    }

    @POST
    public Developer add(NewDeveloperRequest request) {
        var newDeveloper = Developer.newDeveloper(request.name(), request.birthday());
        return template.insert(newDeveloper);
    }

    @Path("{id}")
    @GET
    public Developer get(@PathParam("id") String id) {
        return template.find(Developer.class, id)
                .orElseThrow(() -> new WebApplicationException(Response.Status.NOT_FOUND));
    }

    public record UpdateDeveloperRequest(String name, LocalDate birthday) {
    }

    @Path("{id}")
    @PUT
    public Developer update(@PathParam("id") String id, UpdateDeveloperRequest request) {
        var developer = template.find(Developer.class, id)
                .orElseThrow(() -> new WebApplicationException(Response.Status.NOT_FOUND));
        var updatedDeveloper = developer.update(request.name(), request.birthday());
        return template.update(updatedDeveloper);

    }

    @Path("{id}")
    @DELETE
    public void delete(@PathParam("id") String id) {
        template.delete(Developer.class, id);
    }
}
```

## Test the REST API

Now that we've created our RESTful API for managing developer records, it's time to put it to the test. We'll
demonstrate how to interact with the API using various HTTP requests and command-line tools.

### Start the project:

```shell
./mvnw compile quarkus:dev
```

### Create a new developer with POST

You can use the `POST` request to create a new developer record. We'll use `curl` for this demonstration:

```shell
curl -X POST "http://localhost:8080/developers" -H 'Content-Type: application/json' -d '{"name": "Max", "birthday": "
2022-05-01"}'
```

This `POST` request sends a JSON payload with the developer’s name and birthday to the API endpoint. You’ll receive a
response with the details of the newly created developer.

### Read the developers with GET

To retrieve a list of developers, you can use the `GET` request:

```shell
curl http://localhost:8080/developers
```

This `GET` request returns a list of all developers stored in the database.
To fetch details of a specific developer, provide their unique id in the URL:

```shell
curl http://localhost:8080/developers/a6905449-4523-48b6-bcd8-426128014582
```

This request will return the developer’s information associated with the provided id.

### Update a developer with PUT

You can update a developer’s information using the `PUT` request:

```shell
curl -X PUT "http://localhost:8080/developers/a6905449-4523-48b6-bcd8-426128014582" -H 'Content-Type: application/json'
-d '{"name": "Owen", "birthday": "2022-05-01"}'
```

In this example, we update the developer with the given id by providing a new name and birthday in the JSON payload.

### Delete a developer with DELETE

Finally, to delete a developer record, use the DELETE request:

```shell
curl -X DELETE "http://localhost:8080/developers/a6905449-4523-48b6-bcd8-426128014582"
```

This request removes the developer entry associated with the provided `id` from the database.

Following these simple steps, you can interact with your RESTful API to manage developer records effectively. These HTTP
requests allow you to create, read, update, and delete developer entries, providing full control and functionality for
your API.

Explore and adapt these commands to suit your specific use cases and requirements.

## Using OpenAPI to test and explore your API

OpenAPI is a powerful tool that allows you to test and explore your API visually. You can access the OpenAPI
documentation for your Quarkus project at the following URL:

```html
http://localhost:8080/q/swagger-ui/
```

OpenAPI provides a user-friendly interface that displays all the available endpoints and their descriptions and allows
you to make API requests directly from the browser. It’s an essential tool for API development because it:
1. Facilitates API testing: You can send requests and receive responses directly from the OpenAPI interface, making it easy
to verify the functionality of your API.
2. Generates documentation: This is crucial for developers who need to understand how to use your API effectively.
3. Allows for exploration: You can explore all the available endpoints, their input parameters, and expected responses,
which helps you understand the API’s capabilities.
4. Assists in debugging: It shows request and response details, making identifying and resolving issues easier.

In conclusion, using OpenAPI alongside your RESTful API simplifies the testing and exploration process, improves
documentation, and enhances the overall developer experience when working with your API. It’s an essential tool in
modern API development practices.

## Conclusion

In this tutorial, you’ve gained valuable insights into building a REST API using Quarkus and seamlessly integrating it
with Eclipse JNoSQL for MongoDB. You now can efficiently manage developer records through a unified API, streamlining
your NoSQL database operations. However, to take your MongoDB experience even further and leverage the full power of
MongoDB Atlas, consider migrating your application to MongoDB Atlas.

MongoDB Atlas offers a powerful document model, enabling you to store data as JSON-like objects that closely resemble
your application code. With MongoDB Atlas, you can harness your preferred tools and programming languages. Whether you
manage your clusters through the MongoDB CLI for Atlas or embrace infrastructure-as-code (IaC) tools like Terraform or
Cloudformation, MongoDB Atlas provides a seamless and scalable solution for your database needs.

Ready to explore the benefits of MongoDB Atlas? Get started now by [trying MongoDB Atlas](https://www.mongodb.com/cloud/atlas/lp/try4).

[Access the source code](https://github.com/JNOSQL/demos-ee/tree/main/quarkus-jnosql-mongodb) used in this tutorial.

Any questions? Come chat with us in the [MongoDB Community Forum](https://www.mongodb.com/community/forums/).
