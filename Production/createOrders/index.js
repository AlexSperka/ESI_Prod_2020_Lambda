/**
 * Function to add new Orders to production table
 * 
 * @alias    esi_prod_createOrders
 * @memberof ProductionTeamESI
 *
 * @param {Object} orderObject     JSON Object with new Order
 * {
      "body": {
        "endDate": "25.05.2020",
        "productionOrderNumber": "C-20170327-90125-1",
        "articleNumber": "10000001",
        "color": "#79B6FF",
        "colorName": "Himmelblau",
        "quantity": 5,
        "hasPrint": true,
        "motiveNumber": 3460
      }
    }
 *
 * @return {String} Return value description.
 */

/********************************* Librarys ***********************************/
const mysql = require('mysql2'); // require mysql
var moment = require("moment-timezone");

var convert = require('color-convert');
var DeltaE = require('delta-e');

/********************************* Variables **********************************/
var date = 0;
var time = 0;
var endDate = 0;
var productionOrderNumber = 0;
var articleNumber = 0;
var color = 0;
var colorName = 0;
var quantity = 0;
var hasPrint = 0;
var motiveNumber = 0;
var prodSortNum = 0;
var prodStatus = "\'" + 'open' + "\'";
var splitOrders = "\'" + 'False' + "\'";

var colorCyan = 0;
var colorMagenta = 0;
var colorYellow = 0;
var colorKey = 0;

var deltaE = 0;

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

  convertHEXtoCMYK(newOrder.body.color);

  compareColor(newOrder.body.color);

  callDB(client, deleteNullRowSQL(), callback);
  // asynchCallDB(client, writeOrdersToDB(newOrder, date, time));
  
  return productionOrderNumber;
};

/********************************* Database Call ******************************/
const callDB = (client, queryMessage, callback) => {
  client.query(queryMessage,
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

/********************************* Asynch Database Call ***********************/

/*  Timeout right now, not working   */
const asynchCallDB = async (connection, queryMessage) => {
  try {
      const data = await new Promise((resolve, reject) => {
          connection.connect(function (err) {
              if (err) {
                  reject(err);
              }
              connection.query(queryMessage,
                  function (err, result) {
                      if (err) {
                          console.log("Error->" + err);
                          reject(err);
                      }
                      resolve(result);
                  });
          });
      });
      return {
          statusCode: 200,
          body: JSON.stringify(data)
      };
  } catch (err) {
      return {
          statusCode: 400,
          body: err.message
      };
  }
};

/********************************* Creating Order String for SQL***************/
const writeOrdersToDB = function (newOrder, date, time) {
  endDate = "\'" + newOrder.body.endDate + "\'"; //Promised date to customer
  productionOrderNumber = "\'" + newOrder.body.orderNumber + "-" + newOrder.body.lineItem + "\'";
  articleNumber = +newOrder.body.articleNumber;
  color = "\'" + newOrder.body.color + "\'";
  colorName = "\'" + newOrder.body.colorName + "\'";
  quantity = newOrder.body.quantity;
  // hasPrint = "\'"+newOrder.body.hasPrint+"\'";
  hasPrint = (newOrder.body.hasPrint != 'False') ? 1 : 0; //if hasPrint true then 1 otherwise 0
  motiveNumber = newOrder.body.motiveNumber;

  // This will allow us to freeze open connections to a database

  let newOrderString = "INSERT INTO testdb.ProdTable values(" + date + "," + time + "," + endDate + "," + productionOrderNumber + "," + articleNumber + "," + color + "," + colorName + "," + quantity + "," + hasPrint + "," + motiveNumber + "," + prodSortNum + "," + prodStatus + "," + splitOrders  + "," + colorCyan  + "," + colorMagenta  + "," + colorYellow  + "," + colorKey + "," + deltaE + ")";
  console.log(newOrderString);
  return (newOrderString);
};

/********************************* Helper Function CREATE TABLE ***************/
const createTableSQL = function () {
  var queryMessage = 'CREATE TABLE ProdTable (date DATE, time TIME, endDate DATE, prodOrderNum VARCHAR(255), articleNumber INT, colorHEX VARCHAR(255), colorName VARCHAR(255), quantity INT, hasPrint TINYINT(1), motiveNumber INT, ProdSortNum INT, c TINYINT, m TINYINT, y TINYINT, k TINYINT, prodStatus VARCHAR(30), splitOrders VARCHAR(255) )';
  return (queryMessage);
};

/********************************* Helper Function CREATE DATABASE*************/
const createDatabaseSQL = function () {
  var queryMessage = 'CREATE DATABASE testdb';
  return (queryMessage);
};

/********************************* ADD ROW TO DB *************/
const addRowSQL = function () {
  var queryMessage = 'ALTER TABLE testdb.ProdTable ADD deltaE FLOAT; ';
  return (queryMessage);
};

/********************************* Helper Function GET STUFF FROM DB***********/
const getOrdersFromDB = function () {
  var queryMessage = 'SELECT * FROM testdb.ProdTable LIMIT 10';
  return (queryMessage);
};

/********************************* Helper Function DELETE STUFF FROM DB***********/
const deleteNullRowSQL = function() {
  var queryMessage = 'DELETE FROM testdb.ProdTable WHERE deltaE IS NULL';
  return (queryMessage);
}

const convertHEXtoCMYK = function(colorHEX) {
  var colorCMYK = convert.hex.cmyk(colorHEX);

  colorCyan = colorCMYK[0];
  colorMagenta = colorCMYK[1];
  colorYellow = colorCMYK[2];
  colorKey = colorCMYK[3];
};

/********************************* Compare Color ***********/
const compareColor = function (colorHex) {
  // Create two test LAB color objects to compare!
  var colorWhite = { L: 0, A: 0, B: 0 };
  
  var colorOrder = convert.hex.lab(colorHex);
  colorOrder = {L: colorOrder[0], A: colorOrder[1], B: colorOrder[2]};
  //colorOrder = {L: colorHex[0], A: colorHex[1], B: colorHex[2]};
  console.log(convert.hex.lab(colorHex));
  //var colorOrder = convert.hex.lab(colorHex);
  // 2000 formula
  console.log("Delta E Difference: "+DeltaE.getDeltaE00(colorWhite, colorOrder));
  deltaE = DeltaE.getDeltaE00(colorWhite, colorOrder);
}