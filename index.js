/******** Code from https://dzone.com/articles/aws-lambda-with-mysql-rds-and-api-gateway ******/

/******* Create DB using lambda **************************************************************/

const mysql = require('mysql');
const connection = mysql.createConnection({
    //following param coming from aws lambda env variable 
    host: process.env.RDS_LAMBDA_HOSTNAME,
    user: process.env.RDS_LAMBDA_USERNAME,
    password: process.env.RDS_LAMBDA_PASSWORD,
    port: process.env.RDS_LAMBDA_PORT,
    // calling direct inside code  
    connectionLimit: 10,
    multipleStatements: true,
    // Prevent nested sql statements 
    connectionLimit: 1000,
    connectTimeout: 60 * 60 * 1000,
    acquireTimeout: 60 * 60 * 1000,
    timeout: 60 * 60 * 1000,
    debug: true
});

exports.handler = async (event) => {
    try {
        const data = await new Promise((resolve, reject) => {
            connection.connect(function (err) {
                if (err) {
                    reject(err);
                }
                connection.query('CREATE DATABASE testdb', function (err, result) {
                    if (err) {
                        console.log("Error->" + err);
                        reject(err);
                    }
                    resolve(result);
                });
            })
        });
        return {
            statusCode: 200,
            body: JSON.stringify(data)
        }
    } catch (err) {
        return {
            statusCode: 400,
            body: err.message
        }
    }
};

/******* Insert table in DB using lambda **************************************************************/

exports.handler = async (event) => {
    const sql = "CREATE TABLE MESSAGE (message VARCHAR(255))";
    connection.query(sql, function (err, result) {
        if (err) throw err;
        console.log("Table created");
    });
    return "Table Created"
};
const mysql = require('mysql');
const connection = mysql.createConnection({
//following param coming from aws lambda env variable  
    host: process.env.RDS_LAMBDA_HOSTNAME,
    user: process.env.RDS_LAMBDA_USERNAME,
    password: process.env.RDS_LAMBDA_PASSWORD,
    port: process.env.RDS_LAMBDA_PORT,
    database: process.env.RDS_DATABASE,
// calling direct inside code
    connectionLimit: 10,
    multipleStatements: true,
// Prevent nested sql statements   
    connectionLimit: 1000,
    connectTimeout: 60 * 60 * 1000,
    acquireTimeout: 60 * 60 * 1000,
    timeout: 60 * 60 * 1000,
    debug: true
});
exports.handler = async (event) => {
    try {
        const data = await new Promise((resolve, reject) => {
            connection.connect(function (err) {
                if (err) {
                    reject(err);
                }
                connection.query('CREATE TABLE ProductionDB (date DATE, time TIME, orderNumber VARCHAR(255), customerLastName VARCHAR(255), customerFirstName VARCHAR(255), street VARCHAR(255), postCode INT, city VARCHAR(255), country VARCHAR(255), articleNumber INT, color VARCHAR(255), quantity INT, hasPrint TINYINT(1), motiveNumber INT )',
                    function (err, result) {
                        if (err) {
                            console.log("Error->" + err);
                            reject(err);
                        }
                        resolve(result);
                    });
            })
        });
        return {
            statusCode: 200,
            body: JSON.stringify(data)
        }
    } catch (err) {
        return {
            statusCode: 400,
            body: err.message
        }
    }
};


/******* Insert records using lambda **************************************************************/
/*  date DATE, time TIME, orderNumber VARCHAR(255), customerLastName VARCHAR(255), customerFirstName VARCHAR(255), street VARCHAR(255), postCode INT, city VARCHAR(255), country VARCHAR(255), articleNumber INT, color VARCHAR(255), quantity INT, hasPrint TINYINT(1), motiveNumber INT    */
exports.handler = (event, context, callback) => {
// allows for using callbacks as finish/error-handlers

    context.callbackWaitsForEmptyEventLoop = false;
    const sql = "INSERT INTO testdb.ProductionDB values('2017/03/27','09:12:13','C-20170327-90123','Müller','Johannes','Langestraße 5',77723,'Gengenbach','Deutschland',10000001,'#009900',2,'Y',3456)";
    connection.query(sql, function (err, result) {
        if (err) throw err;
        console.log("1 record inserted");
    });
};


/******* Select records using lambda **************************************************************/

exports.handler = (event, context, callback) => {
    // allows for using callbacks as finish/error-handlers
    context.callbackWaitsForEmptyEventLoop = false;
    const sql = "select * from testdb.Employee ";
    con.query(sql, function (err, result) {
        if (err) throw err;
        callback(null, result)
    });
};

/******* Select records with criteria using lambda **************************************************************/

exports.handler = (event, context, callback) => {
// allows for using callbacks as finish/error-handlers
    context.callbackWaitsForEmptyEventLoop = false;
    const sql = "select * from  testdb.Employee where emp_id = " + event.emp_id;
    con.query(sql, function (err, result) {
        if (err) throw err;
        callback(null, result)
    });
};


