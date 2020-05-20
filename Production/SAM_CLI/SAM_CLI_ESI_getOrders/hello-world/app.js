// const axios = require('axios')
// const url = 'http://checkip.amazonaws.com/';
let response;

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html 
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 * 
 */

// get the client
const mysql = require('mysql2'); // require mysql
// const mysql = require('./node_modules/mysql2/index.js');

// If 'client' variable doesn't exist
if (typeof client === 'undefined') {
  // Connect to the MySQL database
  var client = mysql.createConnection({
        host: process.env.RDS_LAMBDA_HOSTNAME,
        user: process.env.RDS_LAMBDA_USERNAME,
        password: process.env.RDS_LAMBDA_PASSWORD,
        port: process.env.RDS_LAMBDA_PORT,
        database: process.env.RDS_DATABASE,
  });
 
  client.connect()
}


exports.lambdaHandler = async (event, context) => {

   // This will allow us to freeze open connections to a database
   context.callbackWaitsForEmptyEventLoop = false;
 
   //   client.query("INSERT INTO testdb.ProductionDB values('2018/03/29','11:12:13','C-20170327-90125','Schmidt','Achim','Langestraße 5',77723,'Gengenbach','Deutschland',10000002,'#009900',1,'Y',3455)",
   //   function (error, results) {
   //     callback(null, results)
   //   });
   
     client.query("SELECT * FROM testdb.ProductionDB LIMIT 10;",
     function (error, results) {
       callback(null, {
         statusCode: 200,
         body: JSON.stringify({
             data: 'Neue Aufträge wurden erfolgreich zur Datenbank hinzugefügt!',
             dataReturn: results      
         })
       });  
     }); 
};


// let AWS = require('aws-sdk');
// var mysql2 = require('mysql2'); //https://www.npmjs.com/package/mysql2
// let fs = require('fs');

// let connection;

// exports.handler = async (event) => {
//     const promise = new Promise(function (resolve, reject) {

//         console.log("Starting query ...\n");
//         console.log("Running iam auth ...\n");

//         //
//         var signer = new AWS.RDS.Signer({
//             region: 'eu-central-1', // example: us-east-2
//             //following param coming from aws lambda env variable  
//             hostname: process.env.RDS_LAMBDA_HOSTNAME,
//             username: process.env.RDS_LAMBDA_USERNAME,
//             password: process.env.RDS_LAMBDA_PASSWORD,
//             port: process.env.RDS_LAMBDA_PORT,
//             database: process.env.RDS_DATABASE,
//         });

//         let token = signer.getAuthToken({
//             username: process.env.RDS_LAMBDA_USERNAME
//         });

//         console.log("IAM Token obtained\n");

//         let connectionConfig = {
//             host: process.env['endpoint'], // Store your endpoint as an env var
//             user: process.env.RDS_LAMBDA_USERNAME,
//             database: process.env.RDS_DATABASE, // Store your DB schema name as an env var
//             ssl: { rejectUnauthorized: false },
//             password: process.env.RDS_LAMBDA_PASSWORD,
//             authSwitchHandler: function ({ pluginName, pluginData }, cb) {
//                 console.log("Setting new auth handler.");
//             }
//         };

//         // Adding the mysql_clear_password handler
//         connectionConfig.authSwitchHandler = (data, cb) => {
//             if (data.pluginName === process.env.RDS_LAMBDA_PASSWORD) {
//                 // See https://dev.mysql.com/doc/internals/en/clear-text-authentication.html
//                 console.log("pluginName: " + data.pluginName);
//                 let password = token + '\0';
//                 let buffer = Buffer.from(password);
//                 cb(null, password);
//             }
//         };
//         connection = mysql2.createConnection(connectionConfig);

//         connection.connect(function (err) {
//             if (err) {
//                 console.log('error connecting: ' + err.stack);
//                 return;
//             }

//             console.log('connected as id ' + connection.threadId + "\n");
//         });

//         connection.query("SELECT * FROM contacts", function (error, results, fields) {
//             if (error) {
//                 //throw error;
//                 reject("ERROR " + error);
//             }

//             if (results.length > 0) {
//                 let result = results[0].email + ' ' + results[0].firstname + ' ' + results[0].lastname;
//                 console.log(result);

//                 let response = {
//                     "statusCode": 200,
//                     "statusDescription": "200 OK",
//                     "isBase64Encoded": false,
//                     "headers": {
//                         "Content-Type": "text/html"
//                     },
//                     body: result,
//                 };

//                 connection.end(function (error, results) {
//                     if (error) {
//                         //return "error";
//                         reject("ERROR");
//                     }
//                     // The connection is terminated now 
//                     console.log("Connection ended\n");

//                     resolve(response);
//                 });
//             }
//         });
//     });
//     return promise;
// };