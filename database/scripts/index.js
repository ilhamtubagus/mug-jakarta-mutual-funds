// load fixtures
load('../fixtures/mockInvestmentManagers.js');
load('../fixtures/mockProducts.js');
load('../fixtures/mockNavs.js');

// accounts collection
async function defineAccountsSchema(){
    await db.accounts.createIndex( { "email": 1 }, { unique: true } )
    await db.runCommand( { collMod: "accounts",
        validator: {
            $and: [
                {
                    "email": { $regex: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/ },
                    "dateOfBirth": { $regex: /(^0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-(\d{4}$)/ },
                    "nik": { $regex: /^\d{16}$/ }
                },
                {
                    $jsonSchema: {
                        bsonType: "object",
                        required: [ "email", "password", "fullName", "dateOfBirth", "nik", "cif"],
                        properties: {
                            password: {
                                bsonType: "string",
                                minLength: 5
                            },
                            nik:{
                                bsonType: "string",
                                minLength: 16
                            },
                            riskProfile: {
                                bsonType: "string",
                                enum: ["aggressive", "moderate", "moderate conservative", "conservative"]
                            },
                            cif: {
                                bsonType: "string",
                                minLength: 10
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
    await db.productCategories.createIndex( { "productCategoryCode": 1 }, { unique: true } )
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
}
async function insertProductCategories(){
   await db.productCategories.insertMany(productCategories);
}

// investment managers collection
async function defineInvestmentManagersSchema(){
    await db.investmentManagers.createIndex( { "investmentManagerCode": 1 }, { unique: true } )
    await db.runCommand( { collMod: "investmentManagers",
        validator: {
            $and: [
                {
                    $jsonSchema: {
                        bsonType: "object",
                        required: [ "investmentManagerCode", "name", "custodianBank"],
                        properties: {
                            investmentManagerCode: {
                                bsonType: "string"
                            },
                            name: {
                                bsonType: "string"
                            },
                            custodianBank: {
                                bsonType: "string"
                            }
                        }
                    }
                }
            ]
        }
    });
}

async function insertInvestmentManagers(){
    await db.investmentManagers.insertMany(investmentManagers);
}

// products collection
async function defineProductsSchema(){
    await db.products.createIndex({"productCode": 1}, {unique: true})
    await db.runCommand( { collMod: "products",
        validator: {
            $and: [
                {
                    $jsonSchema: {
                        bsonType: "object",
                        required: [ "productCode", "name", "investmentManager", "productCategory"],
                        properties: {
                            productCategory: {
                                bsonType: "string",
                                enum: ["money market", "equity", "fixed income"]
                            }
                        }
                    }
                }
            ]
        }
    });
}

async function insertProducts(){
    await db.products.insertMany(products);
}

// nav's collection
async function defineNavsSchema() {
    await db.navs.createIndex({"productCode": 1, "createdAt": 1})
    await db.runCommand( {collMod: "navs",
        validator: {
            $jsonSchema: {
                bsonType: "object",
                required: [ "currentValue", "productCode", "createdAt"]
            }
        }
    });
}

async function insertNavs(){
    await db.navs.insertMany(navs);
}

async function definePortfoliosSchema(){
    await db.createCollection( "portfolios",
        {
            validator:
                {
                    $jsonSchema: {
                        bsonType: "object",
                        required: [ "cif", "name", "portfolioCode"],
                        properties: {
                            cif: {
                                bsonType: "string",
                                minLength: 10
                            }
                        }
                    }
                }
    });
}

async function definePortfolioProductsSchema(){
    await db.createCollection( "portfolioProducts",
        {
            validator: {
                $jsonSchema: {
                    bsonType: "object",
                    required: [ "units", "product"]
                }
            }
    });
}

async function defineTransactionsSchema(){
    await db.transactions.createIndex( { "transactionID": 1 }, { unique: true } );
    await db.runCommand( { collMod: "transactions",
        validator: {
            $jsonSchema: {
                bsonType: "object",
                required: [ "transactionID", "cif", "amount", "units", "product", "type", "status"]
            },
            properties: {
                product:{
                    bsonType: "object"
                },
                cif: {
                    bsonType: "string",
                    minLength: 10
                },
                type:{
                    enum: ["BUY", "SELL"]
                },
                status: {
                    enum: ["PENDING", "SETTLED", "FAILED"]
                }
            }
        }
    });
}

async function definePaymentRequestSchema(){
    await db.paymentRequests.createIndex( { "transactionID": 1, "paymentCode": 1 }, { unique: true } );
    await db.paymentRequests.createIndex( { "expiredAt": 1 }, { expireAfterSeconds: 86.400 } );
    await db.runCommand( { collMod: "paymentRequests",
        validator: {
            $jsonSchema: {
                bsonType: "object",
                    required: [ "transactionID", "paymentCode", "expiredAt"]
            }
        }
    });
}

async function run(){
    await defineAccountsSchema()
    await defineInvestmentManagersSchema();
    await defineProductsSchema();
    await defineNavsSchema();
    await definePortfoliosSchema();
    await definePortfolioProductsSchema();
    await defineTransactionsSchema();
    await definePaymentRequestSchema();
    await insertInvestmentManagers();
    await insertProducts();
    await insertNavs();
}

run()
    .then(r => print('Successfully run script'))
    .catch(e => print(e));



