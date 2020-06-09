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
const axios = require('axios');

var moment = require("moment-timezone");
var DeltaE = require('delta-e');

// var AWS = require('aws-sdk');

/********************************* Variables **********************************/
var date = 0;
var time = 0;

var url = 0;

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

  //  compareColor();

  callDB(client, selectOrdersFromDB(), callback);
  console.log("test return");
}

// /********************************* Database Call ******************************/
// const callDB = (client, queryMessage, callback) => {
//   client.query(queryMessage,
//     function (error, results) {   /* https://stackoverflow.com/questions/35754766/nodejs-invoke-an-aws-lambda-function-from-within-another-lambda-function */

//       //callCreateCSV(results);
//       console.log("Query fineshed");
//       callback(null, results);

//     });
// };

/********************************* Database Call ******************************/
const callDB = (client, queryMessage, callback) => {

  var queryResult = 0;

  client.promise().query(queryMessage)
    .then(
      (results) => {
        queryResult = results[0];
        return queryResult; /* https://developer.mozilla.org/de/docs/Web/JavaScript/Guide/Using_promises   */
        //callback(null, results[0]);
        //console.log(results);
      })
    .then(
      (results) => {
        //queryResult = results[0];
        callCreateCSV(queryResult, callback);
        console.log("Call CreateCSV")
      })
    .catch(console.log)
    .then(() => client.end());

};

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

const compareColor = function () {
  // Create two test LAB color objects to compare!
  var color1 = { L: 0, A: 0, B: 0 };
  var color2 = { L: 100, A: 40, B: 90 };
  // 2000 formula
  console.log(DeltaE.getDeltaE00(color1, color2));
  DeltaE.getDeltaE00()
}

const callCreateCSV = function (data, callback) {
  let parsed;

  var responseCreateCSV = 0;
  console.log("Called response Create CSV");

  axios.post('https://2pkivl4tnh.execute-api.eu-central-1.amazonaws.com/prod/createCSV', data)
    .then((res) => {

      console.log("Res.data = " + res.data.body)
      //data = JSON.stringify(res.data)
      data = JSON.parse(res.data.body)
      //url = data.url
      console.log("URL: "+data.url)
      callback(null, data)

    })
    .catch((error) => {
      console.error(error)
    })
}