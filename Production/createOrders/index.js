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
        "orderNumber": "C-20170327-90125",
        "lineItem": 1,
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
const mysql = require('mysql2/promise'); // require mysql
var moment = require("moment-timezone");

var convert = require('color-convert');
var DeltaE = require('delta-e');

var tools = require('./tools'); /**  helper functions regarding SQL calls (SELECT, ALTER, ADD, DELETE, ...) */

/********************************* Variables **********************************/
var date = 0;
var time = 0;
var endDate = 0;
var orderNumber = 0;
var lineItem = 0;
var productionOrderNumber = 0;
var articleNumber = 0;
var color = 0;
var colorName = 0;
var quantity = 0;
var hasPrint = 0;
var motiveNumber = 0;
var prodStatus = "\'" + 'open' + "\'";
var splitOrders = "\'" + 'False' + "\'";

var colorCyan = 0;
var colorMagenta = 0;
var colorYellow = 0;
var colorKey = 0;

var deltaE = 0;
var maxProdOrderNum = null;

/********************************* SQL Connection *****************************/
// If 'client' variable doesn't exist
const settings = {
  host: process.env.RDS_LAMBDA_HOSTNAME,
  user: process.env.RDS_LAMBDA_USERNAME,
  password: process.env.RDS_LAMBDA_PASSWORD,
  port: process.env.RDS_LAMBDA_PORT,
  database: process.env.RDS_DATABASE,
  connectionLimit: 2
}

/********************************* Timeout Fct *****************************/
const sleep = ms => {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

/******************************************************************************/
/********************************* Export Handler *****************************/
exports.handler = async (event, context, callback) => {

  const pool = await mysql.createPool(settings)

  time = "\'" + moment().format('HH:mm:ss') + "\'";  //get UTC Time
  date = "\'" + moment().format('YYYY:MM:DD') + "\'";
  console.log("date & time UTC: " + time + " and " + date);

  console.log('Received event:', JSON.stringify(event, null, 2));

  try {

    let newOrder = JSON.stringify(event);
    newOrder = JSON.parse(newOrder);

    convertHEXtoCMYK(newOrder.body.color);
    compareColor(newOrder.body.color);

    await getMaxValue(pool)

    await callDB(pool, writeOrdersToDB(newOrder, date, time));

    const response = {
      statusCode: 200,
      body: {
        "prodOrderNum": productionOrderNumber,
      }
    };

    return response;

  } catch (error) {
    console.log(error);

    const response = {
      statusCode: 400,
      body: {
        "prodOrderNum": productionOrderNumber,
        "error": error,
      }
    };

    return response;
  } finally {
    await pool.end()
  }

};

/********************************* Generic Database Call ******************************/
async function callDB(client, queryMessage) {
  await client.query(queryMessage)
    .then(
      (results) => {
        console.log("Database response:")
        console.log(results)
      })
    .catch(console.log)
};

/********************************* Database Call Max Value ******************************/
async function getMaxValue(client) {
  var queryMessage = "SELECT MAX(prodOrderNum) AS 'ProdOrderNum' FROM esi_prod.ProdTable";
  await client.query(queryMessage)
    .then(results => {
      console.log(results[0]);
      var data = results[0];
      data = data[0];
      data = JSON.stringify(data.ProdOrderNum);
      
      if(maxProdOrderNum === null) {
        maxProdOrderNum = 0;
      } else {
        maxProdOrderNum = parseInt(data, 10);
      }
      console.log("Max Prod Num = " + maxProdOrderNum);

    })
    .catch(console.log)
};

/********************************* Creating Order String for SQL***************/
const writeOrdersToDB = function (newOrder, date, time) {
  endDate = "\'" + newOrder.body.endDate + "\'"; //Promised date to customer
  
  if(typeof newOrder.body.orderNumber !== 'undefined'){
    orderNumber = "\'" + newOrder.body.orderNumber + "\'"
  } else { orderNumber = null }
  
  lineItem = "\'" + newOrder.body.lineItem + "\'"
  articleNumber = +newOrder.body.articleNumber;
  color = "\'" + newOrder.body.color + "\'";
  colorName = "\'" + newOrder.body.colorName + "\'";
  quantity = newOrder.body.quantity;
  // hasPrint = "\'"+newOrder.body.hasPrint+"\'";
  hasPrint = (newOrder.body.hasPrint != 'False') ? 1 : 0; //if hasPrint true then 1 otherwise 0
  motiveNumber = newOrder.body.motiveNumber;

  productionOrderNumber = parseInt(maxProdOrderNum) + 1;

  let newOrderString = "INSERT INTO esi_prod.ProdTable values(" + date + "," + time + "," + endDate + "," + orderNumber+ "," +  lineItem + "," + productionOrderNumber + "," + articleNumber + "," + color + "," + colorName + "," + quantity + "," + hasPrint + "," + motiveNumber + "," + prodStatus + "," + splitOrders + "," + colorCyan + "," + colorMagenta + "," + colorYellow + "," + colorKey + "," + deltaE + ")";
  console.log(newOrderString);
  return (newOrderString);
};

/********************************* Convert Hex to CMYK ***************************/
const convertHEXtoCMYK = function (colorHEX) {
  var colorCMYK = convert.hex.cmyk(colorHEX);

  colorCyan = colorCMYK[0];
  colorMagenta = colorCMYK[1];
  colorYellow = colorCMYK[2];
  colorKey = colorCMYK[3];
};

/********************************* Compare Color and calculate Delta E ***********/
const compareColor = function (colorHex) {
  // Create two test LAB color objects to compare!
  var colorWhite = { L: 100, A: 0, B: 0 };

  var colorOrder = convert.hex.lab(colorHex);
  colorOrder = { L: colorOrder[0], A: colorOrder[1], B: colorOrder[2] };
  //colorOrder = {L: colorHex[0], A: colorHex[1], B: colorHex[2]};
  console.log(convert.hex.lab(colorHex));
  //var colorOrder = convert.hex.lab(colorHex);
  // 2000 formula
  console.log("Delta E Difference: " + DeltaE.getDeltaE00(colorWhite, colorOrder)); /** Compared color to https://www.easyrgb.com/en/convert.php#inputFORM */
  deltaE = DeltaE.getDeltaE00(colorWhite, colorOrder);
}