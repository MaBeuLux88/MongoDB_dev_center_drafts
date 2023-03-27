db.createRole(
    {
        role: "view_access",
        privileges: [
            {resource: {db: "test", collection: "employees_view"}, actions: ["find"]}
        ],
        roles: [
            {role: "read", db: "admin"}
        ]
    }
)

db.createUser({user: 'root', pwd: 'root', roles: ["root"]})

db.createUser({user: 'view_user', pwd: '123', roles: ["view_access"]})