/**
 * Function to add new Orders to production table
 * 
 * @alias    esi_prod_readOrderInfo
 * @memberof ProductionTeamESI
 *
 *
 * @param ProdOrderNum
 *
 * @return {String} Order Information
 */

/********************************* Librarys ***********************************/
const mysql = require('mysql2'); /* require mysql - https://npmdoc.github.io/node-npmdoc-mysql2/build/apidoc.html#apidoc.module.mysql2.promise */

var moment = require("moment-timezone");

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
  let orderNumber = JSON.stringify(event);
  orderNumber = JSON.parse(orderNumber);
  // console.log('Color Name: ', orderNumber.body.colorName);

  context.callbackWaitsForEmptyEventLoop = false;

  //  compareColor();

  callDB(client, selectProdOrderFromDB(orderNumber), callback);
  console.log("test return");
}


/********************************* Database Call ******************************/
const callDB = (client, queryMessage, callback) => {

  var queryResult = 0;

  client.promise().query(queryMessage)
    .then(
      (results) => {
        queryResult = results[0];
        console.log(results[0]);
        return queryResult; /* https://developer.mozilla.org/de/docs/Web/JavaScript/Guide/Using_promises   */
        //callback(null, results[0]);
        //console.log(results);
      })
    .then(
      (results) => {
        //queryResult = results[0];
        
        const response = {
          statusCode: 200,
          body: results
        };
    
        callback(null, response);
        console.log("Return " + results);
      })
    .catch(console.log)
    .then(() => client.end());

};

/********************************* Helper Function SELECT Order FROM DB***********/
const selectProdOrderFromDB = function (orderNumber) {
  var queryMessage = "SELECT prodOrderNum, articleNumber, quantity FROM  testdb.ProdTable WHERE prodOrderNum =" + orderNumber.prodOrderNum;
  return (queryMessage);
};

/********************************* Helper Function GET STUFF FROM DB***********/
const getOrdersFromDB = function () {
  var queryMessage = 'SELECT * FROM testdb.ProdTable LIMIT 10';
  return (queryMessage);
};

/********************************* Helper Function GET STUFF FROM DB***********/
const selectOrdersFromDB = function () {
  var queryMessage = "SELECT * FROM  testdb.ProdTable WHERE prodStatus =" + "'open'" + "ORDER BY deltaE";
  return (queryMessage);
};
