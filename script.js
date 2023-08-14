// accounts collections
db.accounts.createIndex( { "email": 1 }, { unique: true } )
db.runCommand( { collMod: "accounts",
    validator: {
        $and: [
            {
                "email": { $regex: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/ }
            },
            {
                $jsonSchema: {
                    bsonType: "object",
                    required: [ "email", "password", "fullName"],
                    properties: {
                        fullName: {
                            bsonType: "string"
                        },
                        password: {
                            bsonType: "string",
                            minLength: 5
                        }
                    }
                }
            }
        ]
    }
});
