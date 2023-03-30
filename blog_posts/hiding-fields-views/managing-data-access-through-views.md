# Secure Data Access Control in MongoDB: How to Use Views to Hide Sensitive Fields

## Introduction

Sometimes, MongoDB collections contain sensitive information that require access control.
Using the [Role-Based Access Control](https://www.mongodb.com/docs/manual/core/authorization/) (RBAC) provided by MongoDB, it's easy to restrict access to this collection.
But what if you want to share your collection to a wider audience without exposing sensitive data?

For example, it could be interesting to share your collections with the marketing team for analytics purposes without sharing [personal identifiable information](https://en.wikipedia.org/wiki/Personal_data) (PII) or data you prefer to keep private like employee salaries.

It's possible to achieve this result with [MongoDB views](https://www.mongodb.com/docs/manual/core/views/) combined with the MongoDB RBAC and this is what we are going to explore in this blog post.

## Prerequisites

You'll need either:
- A MongoDB cluster with authentication activated (which is somewhat recommended in production!)
- A MongoDB Atlas cluster

I'll assume you already have an admin user on your cluster with full authorizations or at least a user that can create views, custom roles and users.
If you are in Atlas, you can create this user in the `Database Access` tab or use [the MongoDB Shell](https://www.mongodb.com/docs/mongodb-shell/) like this:

```bash
mongosh "mongodb://localhost/admin" --quiet --eval "db.createUser({'user': 'root', 'pwd': 'root', 'roles': ['root']});"
```

Then you can [connect with the command line provided in Atlas](https://www.mongodb.com/docs/atlas/tutorial/connect-to-your-cluster/#connect-to-your-atlas-cluster) or like this if you are not in Atlas:

```js
mongosh "mongodb://localhost" --quiet -u root -p root
```

## Creating a MongoDB Collection with Sensitive Data

In this example, I'll pretend to have an `employees` collection with sensitive data:

```js
db.employees.insertMany(
    [
        {
            _id: 1,
            firstname: 'Scott',
            lastname: 'Snyder',
            age: 21,
            ssn: '351-40-7153',
            salary: 100000
        },
        {
            _id: 2,
            firstname: 'Patricia',
            lastname: 'Hanna',
            age: 57,
            ssn: '426-57-8180',
            salary: 95000
        },
        {
            _id: 3,
            firstname: 'Michelle',
            lastname: 'Blair',
            age: 61,
            ssn: '399-04-0314',
            salary: 71000
        },
        {
            _id: 4,
            firstname: 'Benjamin',
            lastname: 'Roberts',
            age: 46,
            ssn: '712-13-9307',
            salary: 60000
        },
        {
            _id: 5,
            firstname: 'Nicholas',
            lastname: 'Parker',
            age: 69,
            ssn: '320-25-5610',
            salary: 81000
        }
    ]
)
```

## How to Create a View in MongoDB to Hide Sensitive Fields

Now I want to share this collection to a wider audience, but I don’t want to share the social security numbers and salaries.

To solve this issue, I can create a [view](https://www.mongodb.com/docs/manual/core/views/) with a `$project` [stage](https://www.mongodb.com/docs/manual/reference/operator/aggregation-pipeline/) that only allows a set of selected fields.

```js
db.createView('employees_view', 'employees', [{$project: {firstname: 1, lastname: 1, age: 1}}])
```

> Note that I'm not doing `{$project: {ssn: 0, salary: 0}}` because every field except these two would appear in the view.
It works today, but maybe tomorrow I'll add a `credit_card` field in some documents and it would then appear instantly in the view.

Let's confirm that the view works:

```js
db.employees_view.find()
```
Results:

```js
[
  { _id: 1, firstname: 'Scott', lastname: 'Snyder', age: 21 },
  { _id: 2, firstname: 'Patricia', lastname: 'Hanna', age: 57 },
  { _id: 3, firstname: 'Michelle', lastname: 'Blair', age: 61 },
  { _id: 4, firstname: 'Benjamin', lastname: 'Roberts', age: 46 },
  { _id: 5, firstname: 'Nicholas', lastname: 'Parker', age: 69 }
]
```

Depending on your schema design and how you want to filter the fields, it could be easier to use [$unset](https://www.mongodb.com/docs/manual/reference/operator/aggregation/unset/) instead of [$project](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/). You can learn more [here](https://www.practical-mongodb-aggregations.com/guides/project.html#when-to-use-set--unset). But again, `$unset` will just remove the specified fields without filtering new fields that could be added in the future.

## Managing Data Access with MongoDB Roles and Users

Now that we have our view, we can share this with restricted access rights. In MongoDB, we need to create a custom role to achieve this.

Here are the command lines if you are not in Atlas.

```js
use admin
db.createRole(
    {
        role: "view_access",
        privileges: [
            {resource: {db: "test", collection: "employees_view"}, actions: ["find"]}
        ],
        roles: []
    }
)
```

Then we can create the user:

```js
use admin
db.createUser({user: 'view_user', pwd: '123', roles: ["view_access"]})
```

If you are in Atlas, database access is managed directly in the Atlas website in the `Database Access` tab. You can also use the Atlas CLI if you feel like it.

![Database access tab in Atlas](/home/polux/Work/MongoDB_dev_center_drafts/blog_posts/hiding-fields-views/images/1_db_access.png)

Then you need to create a custom role.

![Custom Roles tab in Atlas](/home/polux/Work/MongoDB_dev_center_drafts/blog_posts/hiding-fields-views/images/2_custom_roles.png)

![Create the custom role in Atlas](/home/polux/Work/MongoDB_dev_center_drafts/blog_posts/hiding-fields-views/images/3_create_role.png)

> Note: In step 2, I only selected the _Collection Actions > Query and Write Actions > find_ option.

Now that your role is created, head back to the `Database Users` tab and create a user with this custom role.

![Navigation to create a user in Atlas](/home/polux/Work/MongoDB_dev_center_drafts/blog_posts/hiding-fields-views/images/4_create_user_nav.png)

![Create a user in Atlas with a custom role](/home/polux/Work/MongoDB_dev_center_drafts/blog_posts/hiding-fields-views/images/5_create_user.png)

## Testing Data Access Control with Restricted User Account

Now that our user is created. We can confirm that this new restricted user doesn't have access to the underlying collection but has access to the view.

```js
$ mongosh "mongodb+srv://hidingfields.as3qc0s.mongodb.net/test" --apiVersion 1 --username view_user --quiet
Enter password: ***
Atlas atlas-odym8f-shard-0 [primary] test> db.employees.find()
MongoServerError: user is not allowed to do action [find] on [test.employees]
Atlas atlas-odym8f-shard-0 [primary] test> db.employees_view.find()
[
  { _id: 1, firstname: 'Scott', lastname: 'Snyder', age: 21 },
  { _id: 2, firstname: 'Patricia', lastname: 'Hanna', age: 57 },
  { _id: 3, firstname: 'Michelle', lastname: 'Blair', age: 61 },
  { _id: 4, firstname: 'Benjamin', lastname: 'Roberts', age: 46 },
  { _id: 5, firstname: 'Nicholas', lastname: 'Parker', age: 69 }
]
```

## Wrap-up

In this blog post, you learned how to share your MongoDB collections to a wider audience - even the most critical ones - without exposing sensitive data.

Note that views can use the indexes from the source collection so your restricted user can leverage those for more advanced queries.

You could also choose to add an extra `$match` stage before your $project stage to filter entire documents from ever appearing in the view. You can see an example [here](https://www.practical-mongodb-aggregations.com/examples/securing-data/restricted-view.html). And don't forget to support the `$match` with an index!
