// load fixtures
load('../fixtures/mockInvestmentManagers.js');
load('../fixtures/mockProductCategories.js');
load('../fixtures/mockProducts.js');
load('../fixtures/mockNavs.js');

// accounts collection
async function defineAccountsSchema(){
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
async function defineProductCategoriesSchema(){
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
async function defineInvestmentManagersSchema(){
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

// products collection
async function defineProductsSchema(){
    await db.runCommand( { collMod: "products",
        validator: {
            $and: [
                {
                    $jsonSchema: {
                        bsonType: "object",
                        required: [ "productCode", "name", "investmentManager", "productCategory"]
                    }
                }
            ]
        }
    });
    await db.products.createIndex({"productCode": 1}, {unique: true})
}

async function insertProducts(){
    await db.products.insertMany(products);
}

// nav's collection
async function defineNavsSchema() {
    await db.runCommand( { collMod: "navs",
        validator: {
            $and: [
                {
                    $jsonSchema: {
                        bsonType: "object",
                        required: [ "currentValue", "productCode", "createdAt"]
                    }
                }
            ]
        }
    });
}

async function insertNavs(){
    await db.navs.insertMany(navs);
}

async function run(){
    await defineAccountsSchema()
    await defineProductCategoriesSchema();
    await defineInvestmentManagersSchema();
    await defineProductsSchema();
    await defineNavsSchema();
    await insertProductCategories();
    await insertInvestmentManagers();
    await insertProducts();
    await insertNavs();
}

run()
    .then(r => print('Successfully run script'))
    .catch(e => print(e));



