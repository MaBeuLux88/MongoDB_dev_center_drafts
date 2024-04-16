# Microservices Architecture With Java, Spring, and MongoDB

## Introduction

"Microservices are awesome and monolithic applications are evil."

If you are reading this article, you have already read that a million times, and I'm not the one who's going to tell
you otherwise!

In this post, we are going to create a microservices architecture using MongoDB.

## TL;DR

The source code is available in these two repositories.

The [README.md](https://github.com/mongodb-developer/microservices-architecture-mongodb/blob/main/README.md) files will
help you start everything.

```bash
git clone git@github.com:mongodb-developer/microservices-architecture-mongodb.git
git clone git@github.com:mongodb-developer/microservices-architecture-mongodb-config-repo.git
```

## Microservices architecture

We are going to use Spring Boot and Spring Cloud dependencies to build our architecture.

Here is what a microservices architecture looks like, [according to Spring](https://spring.io/microservices):

![Spring Microservices Architecture][1]

We need several services to run this project. Let's talk about them one by one.

As you read this post, I suggest that you follow the instructions in the [README.md](https://github.com/mongodb-developer/microservices-architecture-mongodb/blob/main/README.md) file and start the service related to each section.

### Config server

The first service that we need is a configuration server.

This service allows us to store all the configuration files of our microservices in a single repository so our
configurations are easy to version and store.

The configuration of our config server is simple and straight to the point:

```properties
spring.application.name=config-server
server.port=8888
spring.cloud.config.server.git.uri=${HOME}/Work/microservices-architecture-mongodb-config-repo
spring.cloud.config.label=main
```

It allows us to locate the git repository that stores our microservices configuration and the branch that should be
used.

> Note that the only "trick" you need in your Spring Boot project to start a config server is the `@EnableConfigServer`
> annotation.

```java
package com.mongodb.configserver;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.config.server.EnableConfigServer;

@EnableConfigServer
@SpringBootApplication
public class ConfigServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(ConfigServerApplication.class, args);
    }
}
```

### Service registry

A service registry is like a phone book for microservices. It keeps track of which microservices are running and where
they are located (IP address and port). Other services can look up this information to find and communicate with the
microservices they need.

A service registry is useful because it enables client-side load balancing and decouples service providers from
consumers without the need for DNS.

Again, you don't need much to be able to start a Spring Boot service registry. The `@EnableEurekaServer` annotation
makes all the magic happen.

```java
package com.mongodb.serviceregistry;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;

@SpringBootApplication
@EnableEurekaServer
public class ServiceRegistryApplication {
    public static void main(String[] args) {
        SpringApplication.run(ServiceRegistryApplication.class, args);
    }
}
```

The configuration is also to the point:

```properties
spring.application.name=service-registry
server.port=8761
eureka.client.register-with-eureka=false
eureka.client.fetch-registry=false
```

> The last two lines prevent the service registry from registering to itself and retrieving the registry from itself.

### API gateway

The API gateway service allows us to have a single point of entry to access all our microservices. Of course, you should
have more than one in production, but all of them will be able to communicate with all the microservices and distribute
the workload evenly by load-balancing the queries across your pool of microservices.

Also, an API gateway is useful to address cross-cutting concerns like security, monitoring, metrics gathering, and
resiliency.

When our microservices start, they register themselves to the service registry. The API gateway can use this registry to
locate the microservices and distribute the queries according to its routing configuration.

```yaml
server:
  port: 8080

spring:
  application:
    name: api-gateway
  cloud:
    gateway:
      routes:
        - id: company-service
          uri: lb://company-service
          predicates:
            - Path=/api/company/**,/api/companies
        - id: employee-service
          uri: lb://employee-service
          predicates:
            - Path=/api/employee/**,/api/employees

eureka:
  client:
    register-with-eureka: true
    fetch-registry: true
    service-url:
      defaultZone: http://localhost:8761/eureka/
  instance:
    hostname: localhost
```

> Note that our API gateway runs on port 8080.

### MongoDB microservices

Finally, we have our MongoDB microservices.

Microservices are supposed to be independent of each other. For this reason, we need two MongoDB instances: one for
each microservice.

Check out the [README.md](https://github.com/mongodb-developer/microservices-architecture-mongodb/blob/main/README.md)
file to run everything.

> Note that in
> the [configuration files](https://github.com/mongodb-developer/microservices-architecture-mongodb-config-repo) for the
> company and employee services, they are respectively running on ports 8081 and 8082.

[company-service.properties](https://github.com/mongodb-developer/microservices-architecture-mongodb-config-repo/blob/main/company-service.properties)

```properties
spring.data.mongodb.uri=${MONGODB_URI_1:mongodb://localhost:27017}
spring.threads.virtual.enabled=true
management.endpoints.web.exposure.include=*
management.info.env.enabled=true
info.app.name=Company Microservice
info.app.java.version=21
info.app.type=Spring Boot
server.port=8081
eureka.client.register-with-eureka=true
eureka.client.fetch-registry=true
eureka.client.service-url.defaultZone=http://localhost:8761/eureka/
eureka.instance.hostname=localhost
```

[employee-service.properties](https://github.com/mongodb-developer/microservices-architecture-mongodb-config-repo/blob/main/employee-service.properties)

```properties
spring.data.mongodb.uri=${MONGODB_URI_2:mongodb://localhost:27018}
spring.threads.virtual.enabled=true
management.endpoints.web.exposure.include=*
management.info.env.enabled=true
info.app.name=Employee Microservice
info.app.java.version=21
info.app.type=Spring Boot
server.port=8082
eureka.client.register-with-eureka=true
eureka.client.fetch-registry=true
eureka.client.service-url.defaultZone=http://localhost:8761/eureka/
eureka.instance.hostname=localhost
```

> Note that the two microservices are connected to two different MongoDB clusters to keep their independence. The
> company service is using the MongoDB node on port 27017 and the employee service is on port 27018.

Of course, this is only if you are running everything locally. In production, I would recommend to use two clusters on
MongoDB Atlas. You can overwrite the MongoDB URI with the environment variables (see [README.md](https://github.com/mongodb-developer/microservices-architecture-mongodb/blob/main/README.md)).

## Test the REST APIs

At this point, you should have five services running:

- A config-server on port 8888
- A service-registry on port 8761
- An api-gateway on port 8080
- Two microservices:
  - company-service on port 8081
  - employee-service on port 8082

And two MongoDB nodes on ports 27017 and 27018 or two MongoDB clusters on MongoDB Atlas.

If you start the
script [2_api-tests.sh](https://github.com/mongodb-developer/microservices-architecture-mongodb/blob/main/2_api-tests.sh),
you should get an output like this.

```
DELETE Companies
2
DELETE Employees
2

POST Company 'MongoDB'
POST Company 'Google'

GET Company 'MongoDB' by 'id'
{
    "id": "661aac7904e1bf066ee8e214",
    "name": "MongoDB",
    "headquarters": "New York",
    "created": "2009-02-11T00:00:00.000+00:00"
}

GET Company 'Google' by 'name'
{
    "id": "661aac7904e1bf066ee8e216",
    "name": "Google",
    "headquarters": "Mountain View",
    "created": "1998-09-04T00:00:00.000+00:00"
}

GET Companies
[
    {
        "id": "661aac7904e1bf066ee8e214",
        "name": "MongoDB",
        "headquarters": "New York",
        "created": "2009-02-11T00:00:00.000+00:00"
    },
    {
        "id": "661aac7904e1bf066ee8e216",
        "name": "Google",
        "headquarters": "Mountain View",
        "created": "1998-09-04T00:00:00.000+00:00"
    }
]

POST Employee Maxime
POST Employee Tim

GET Employee 'Maxime' by 'id'
{
    "id": "661aac79cf04401110c03516",
    "firstName": "Maxime",
    "lastName": "Beugnet",
    "company": "Google",
    "headquarters": "Mountain View",
    "created": "1998-09-04T00:00:00.000+00:00",
    "joined": "2018-02-12T00:00:00.000+00:00",
    "salary": 2468
}

GET Employee 'Tim' by 'id'
{
    "id": "661aac79cf04401110c03518",
    "firstName": "Tim",
    "lastName": "Kelly",
    "company": "MongoDB",
    "headquarters": "New York",
    "created": "2009-02-11T00:00:00.000+00:00",
    "joined": "2023-08-23T00:00:00.000+00:00",
    "salary": 13579
}

GET Employees
[
    {
        "id": "661aac79cf04401110c03516",
        "firstName": "Maxime",
        "lastName": "Beugnet",
        "company": "Google",
        "headquarters": "Mountain View",
        "created": "1998-09-04T00:00:00.000+00:00",
        "joined": "2018-02-12T00:00:00.000+00:00",
        "salary": 2468
    },
    {
        "id": "661aac79cf04401110c03518",
        "firstName": "Tim",
        "lastName": "Kelly",
        "company": "MongoDB",
        "headquarters": "New York",
        "created": "2009-02-11T00:00:00.000+00:00",
        "joined": "2023-08-23T00:00:00.000+00:00",
        "salary": 13579
    }
]
```

> Note that the employee service sends queries to the company service to retrieve the details of the employees' company.

This confirms that the service registry is doing its job correctly because the URL only contains a reference to the company microservice, not its direct IP and port.

```java
private CompanyDTO getCompany(String company) {
    String url = "http://company-service/api/company/name/";
    CompanyDTO companyDTO = restTemplate.getForObject(url + company, CompanyDTO.class);
    if (companyDTO == null) {
        throw new EntityNotFoundException("Company not found: ", company);
    }
    return companyDTO;
}
```

## Conclusion

And voilà! You now have a basic microservice architecture running that is easy to use to kickstart your project.

In this architecture, we could seamlessly integrate additional features to enhance performance and maintainability in
production. Caching would be essential, particularly with a potentially large number of employees within the same
company, significantly alleviating the load on the company service.

The addition of a [Spring Cloud Circuit Breaker](https://spring.io/projects/spring-cloud-circuitbreaker) could also
improve the resiliency in production and a [Spring Cloud Sleuth](https://spring.io/projects/spring-cloud-sleuth) would
help with distributed tracing and auto-configuration.

If you have questions, please head to our [Developer Community website](https://www.mongodb.com/community/forums/) where the MongoDB engineers and the MongoDB community will help you build your next big idea with MongoDB.


[1]: https://images.contentstack.io/v3/assets/blt39790b633ee0d5a7/blt332394d666c28140/661ab5bf188d353a3e2da005/microservices-architecture.svg
