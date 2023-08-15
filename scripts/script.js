// accounts collection
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

// product categories collection
db.productCategories.createIndex( { "productCategoryCode": 1 }, { unique: true } )
db.runCommand( { collMod: "productCategories",
    validator: {
        $and: [
            {
                $jsonSchema: {
                    bsonType: "object",
                    required: [ "productCategoryCode", "category"],
                    properties: {
                        productCategoryCode: {
                            bsonType: "string"
                        },
                        category: {
                            bsonType: "string"
                        }
                    }
                }
            }
        ]
    }
});

// investment managers collection
db.investmentManagers.createIndex( { "investmentManagerCode": 1 }, { unique: true } )
db.runCommand( { collMod: "investmentManagers",
    validator: {
        $and: [
            {
                $jsonSchema: {
                    bsonType: "object",
                    required: [ "investmentManagerCode", "name"],
                    properties: {
                        investmentManagerCode: {
                            bsonType: "string"
                        },
                        name: {
                            bsonType: "string"
                        }
                    }
                }
            }
        ]
    }
});

