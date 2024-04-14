# Connection To MongoDB With Java And SOCKS5 Proxy

## Introduction

SOCKS5 is a standardized protocol for communicating with network services through a proxy server. It offers several
advantages like allowing the users to change their virtual location or hide their IP address from the online services.

SOCKS5 also offers an authentication layer that can be used to enhance security.

In our case, the network service is MongoDB. Let's see how we can connect to MongoDB through a SOCKS5 proxy with Java.

## SOCKS5 with vanilla Java

Authentication is optional for SOCKS5 proxies. So to be able to connect to a SOCKS5 proxy, you need:

- **proxyHost**: IPv4, IPv6 or hostname of the proxy.
- **proxyPort**: TCP port number (default 1080).

If authentication is activated, then you'll also need a username and password. Both need to be provided, or it won't
work.

- **proxyUsername**: the proxy username (not null or empty).
- **proxyPassword**: the proxy password (not null or empty).

### Using connection string parameters

The first method to connect to MongoDB through a SOCKS5 proxy is to simply provide the above parameters directly in the
MongoDB connection string.

```java
public MongoClient connectToMongoDBSock5WithConnectionString() {
    String connectionString = "mongodb+srv://myDatabaseUser:myPassword@example.org/" +
                              "?proxyHost=<proxyHost>" +
                              "&proxyPort=<proxyPort>" +
                              "&proxyUsername=<proxyUsername>" +
                              "&proxyPassword=<proxyPassword>";
    return MongoClients.create(connectionString);
}
```

### Using MongoClientSettings

The second method involves passing these parameters into a MongoClientSettings class, which is then used to create the
connection to the MongoDB cluster.

```java
public MongoClient connectToMongoDBSocks5WithMongoClientSettings() {
    String URI = "mongodb+srv://myDatabaseUser:myPassword@example.org/";
    ConnectionString connectionString = new ConnectionString(URI);
    Block<SocketSettings.Builder> socketSettings = builder -> builder.applyToProxySettings(
            proxyBuilder -> proxyBuilder.host("<proxyHost>")
                                        .port(1080)
                                        .username("<proxyUsername>")
                                        .password("<proxyPassword>"));
    MongoClientSettings settings = MongoClientSettings.builder()
                                                      .applyConnectionString(connectionString)
                                                      .applyToSocketSettings(socketSettings)
                                                      .build();
    return MongoClients.create(settings);
}
```

## Connection with Spring Boot

### Using connection string parameters

If you are using Spring Boot or Spring Data MongoDB, you can connect like so is you are passing the SOCKS5 parameters in
the connection string.

Most of the time if you are using Spring Boot or Spring Data, you'll need the codec registry to
support the POJO mappings. So I included this as well.

```java
package com.mongodb.starter;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import org.bson.codecs.configuration.CodecRegistry;
import org.bson.codecs.pojo.PojoCodecProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import static org.bson.codecs.configuration.CodecRegistries.fromProviders;
import static org.bson.codecs.configuration.CodecRegistries.fromRegistries;

@Configuration
public class MongoDBConfiguration {

    @Value("${spring.data.mongodb.uri}")
    private String connectionString;

    @Bean
    public MongoClient mongoClient() {
        CodecRegistry pojoCodecRegistry = fromProviders(PojoCodecProvider.builder().automatic(true).build());
        CodecRegistry codecRegistry = fromRegistries(MongoClientSettings.getDefaultCodecRegistry(), pojoCodecRegistry);
        return MongoClients.create(MongoClientSettings.builder()
                                                      .applyConnectionString(new ConnectionString(connectionString))
                                                      .codecRegistry(codecRegistry)
                                                      .build());
    }

}
```

In this case, all the SOCKS5 action is actually happening in the `application.properties` file of your Spring Boot
project.

```properties
spring.data.mongodb.uri=${MONGODB_URI:"mongodb+srv://myDatabaseUser:myPassword@example.org/?proxyHost=<proxyHost>&proxyPort=<proxyPort>&proxyUsername=<proxyUsername>&proxyPassword=<proxyPassword>"}
```

### Using MongoClientSettings

If you prefer to use the MongoClientSettings, then you can just pass a classic MongoDB URI and handle the different
SOCKS5 parameters directly in the `SocketSettings.Builder`.

```java
package com.mongodb.starter;

import com.mongodb.Block;
import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.connection.SocketSettings;
import org.bson.codecs.configuration.CodecRegistry;
import org.bson.codecs.pojo.PojoCodecProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import static org.bson.codecs.configuration.CodecRegistries.fromProviders;
import static org.bson.codecs.configuration.CodecRegistries.fromRegistries;

@Configuration
public class MongoDBConfigurationSocks5 {

    @Value("${spring.data.mongodb.uri}")
    private String connectionString;

    @Bean
    public MongoClient mongoClient() {
        CodecRegistry pojoCodecRegistry = fromProviders(PojoCodecProvider.builder().automatic(true).build());
        CodecRegistry codecRegistry = fromRegistries(MongoClientSettings.getDefaultCodecRegistry(), pojoCodecRegistry);
        Block<SocketSettings.Builder> socketSettings = builder -> builder.applyToProxySettings(
                proxyBuilder -> proxyBuilder.host("<proxyHost>")
                                            .port(1080)
                                            .username("<proxyUsername>")
                                            .password("<proxyPassword>"));
        return MongoClients.create(MongoClientSettings.builder()
                                                      .applyConnectionString(new ConnectionString(connectionString))
                                                      .applyToSocketSettings(socketSettings)
                                                      .codecRegistry(codecRegistry)
                                                      .build());
    }

}
```

## Conclusion

Hopefully this short guide helped you get connected to MongoDB through your SOCKS5 proxy.

If you want to read more details, you can check out the [Jira ticket 4347](https://jira.mongodb.org/browse/JAVA-4347).

If you have questions, please head to our [developer community website](https://www.mongodb.com/community/forums/) where
the MongoDB engineers and the MongoDB community will help you build your next big idea with MongoDB.
