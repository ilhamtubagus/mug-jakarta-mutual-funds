// load fixtures
load('../fixtures/mockInvestmentManagers.js');
load('../fixtures/mockProductCategories.js');

// accounts collection
async function schemaDefinitionAccounts(){
    await db.accounts.createIndex( { "email": 1 }, { unique: true } )
    await db.runCommand( { collMod: "accounts",
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
}

// product categories collection
async function schemaDefinitionProductCategories(){
   await db.runCommand( { collMod: "productCategories",
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
   await db.productCategories.createIndex( { "productCategoryCode": 1 }, { unique: true } )
}
async function insertProductCategories(){
   await db.productCategories.insertMany(productCategories);
}

// investment managers collection
async function schemaDefinitionInvestmentManagers(){
    await db.runCommand( { collMod: "investmentManagers",
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
    await db.investmentManagers.createIndex( { "investmentManagerCode": 1 }, { unique: true } )
}

async function insertInvestmentManagers(){
    await db.investmentManagers.insertMany(investmentManagers);
}
async function run(){
    await schemaDefinitionAccounts()
    await schemaDefinitionProductCategories();
    await schemaDefinitionInvestmentManagers();
    await insertProductCategories();
    await insertInvestmentManagers();
}

run()
    .then(r => print('Successfully run script'))
    .catch(e => print(e));



