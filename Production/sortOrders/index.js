/**
 * Function to add new Orders to production table
 * 
 * @alias    esi_prod_sortOrders
 * @memberof ProductionTeamESI
 *
 * @fires   esi_prod_callCSV
 * @fires   className#eventName
 * @listens event:eventName
 * @listens className~event:eventName
 *
 * @param none
 *
 * @return {String} Return value description.
 */

/********************************* Librarys ***********************************/
const mysql = require('mysql2'); // require mysql
var moment = require("moment-timezone");

// var AWS = require('aws-sdk');

/********************************* Variables **********************************/
var date = 0;
var time = 0;

// AWS.config.region = 'eu-central-1';
// var lambda = new AWS.Lambda();

/********************************* SQL Connection *****************************/
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

  client.connect();
}

/******************************************************************************/
/********************************* Export Handler *****************************/
exports.handler = (event, context, callback) => {

  // var date = moment();
  time = "\'" + moment().format('HH:mm:ss') + "\'";  //get UTC Time
  date = "\'" + moment().format('DD.MM.YYYY') + "\'";
  console.log("date & time UTC: " + time + " and " + date);

  console.log('Received event:', JSON.stringify(event, null, 2));
  let newOrder = JSON.stringify(event);
  newOrder = JSON.parse(newOrder);
  // console.log('Color Name: ', newOrder.body.colorName);

  context.callbackWaitsForEmptyEventLoop = false;

  callDB(client, selectOrdersFromDB(), callback);

}

/********************************* Database Call ******************************/
const callDB = (client, queryMessage, callback) => {
  client.query(queryMessage,
    function (error, results) {   /* https://stackoverflow.com/questions/35754766/nodejs-invoke-an-aws-lambda-function-from-within-another-lambda-function */

      callback(null, {
        statusCode: 200,
        body: JSON.stringify({
          data: 'Die Aufträge wurden erfolgreich sortiert!',
          dataReturn: results
        })
      });

      var params = {
        FunctionName: 'esi_prod_createCSV', // the lambda function we are going to invoke
        InvocationType: 'RequestResponse',
        LogType: 'Tail',
        Payload: results
      };

      lambda.invoke(params, function (err, data) {
        if (err) {
          context.fail(err);
        } else {
          context.succeed('CreateCSV said ' + data.Payload);
        }
      })
    });
};

// /********************************* Database Call ******************************/
// const callDB = (client, queryMessage, callback) => {
//     client.query(queryMessage,
//       function (error, results) {
//         callback(null, {
//           statusCode: 200,
//           body: JSON.stringify({
//             data: 'Die Aufträge wurden erfolgreich sortiert!',
//             dataReturn: results
//           })
//         });
//       });
//   };

/********************************* Helper Function GET STUFF FROM DB***********/
const getOrdersFromDB = function () {
  var queryMessage = 'SELECT * FROM testdb.ProdTable LIMIT 10';
  return (queryMessage);
};

/********************************* Helper Function GET STUFF FROM DB***********/
const selectOrdersFromDB = function () {
  var queryMessage = "SELECT * FROM  testdb.ProdTable WHERE prodStatus =" + "'open'";
  return (queryMessage);
};
