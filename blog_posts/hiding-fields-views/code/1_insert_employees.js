db.employees.drop()
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
db.createView('employees_view', 'employees', [{$project: {firstname: 1, lastname: 1, age: 1}}])