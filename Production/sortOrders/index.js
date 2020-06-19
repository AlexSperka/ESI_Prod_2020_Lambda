/**
 * Function to get Orders from production table and sort them by color (light to dark), shipping date and production status
 * @author Alex Sp
 * @date 2020-06-17 
 * @alias    esi_prod_sortOrders
 * @memberof ProductionTeamESI
 *
 * @fires   esi_prod_callCSV and handing over the query including the next orders
 *
 * @param none
 *
 * @return {String} Return URL where CSV file with next orders can be downloaded
 */


/********************************* Librarys ***********************************/
const mysql = require('mysql2/promise'); /* require mysql - https://npmdoc.github.io/node-npmdoc-mysql2/build/apidoc.html#apidoc.module.mysql2.promise */
const axios = require('axios');

const moment = require("moment-timezone");

/********************************* Variables **********************************/
var date = 0;
var time = 0;
var dataDB = 0;
var url = '';
var status = '';
var testForEmptyResponse = 'undefined';

var response = '';

const ORDERLIMIT = 3; /** Define how many orders shall be in one CSV file */

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
exports.handler = async (event, context) => {

  const pool = await mysql.createPool(settings)

  // var date = moment();
  time = "\'" + moment().format('HH:mm:ss') + "\'";  //get UTC Time
  date = "\'" + moment().format('DD.MM.YYYY') + "\'";
  console.log("date & time UTC: " + time + " and " + date);

  console.log('Received event:', JSON.stringify(event, null, 2));

  try {

    let data = JSON.stringify(event);
    data = JSON.parse(data);  /** Unused right now, for later POST implementations when handing over parameters */
    console.log(data.prodOrderNum)

    await callDB(pool, selectOrdersFromDB(data.prodOrderNum)); /** Get 10 entries ordered by date, delta e and prod status */

    console.log("Test for Empty Response: " + testForEmptyResponse);

    if (typeof testForEmptyResponse !== 'undefined') {

      await callDBupdateStatus(pool, await updateProdStatus());

      await callCreateCSV(dataDB);
      status = "Die CSV Datei wurde erfolgreich erstellt!";

    } else {
      url = '';
      status = "Es liegen keine neuen Aufträge in der Datenbank vor.";
    }

    response = {
      statusCode: 200,
      body: {
        "url": url,
        "status": status
      }
    };
    
    console.log(response)

  } catch (error) {
    
    response = {
      statusCode: 400,
      body: {
        "url": "That did not work",
        "status": "That did not work",
        "error": error,
      }
    };
    
    console.log(response)

  } finally {
    await pool.end()

    return response;
  }

}

/********************************* Database Call ******************************/
async function callDB(client, queryMessage) {

  var queryResult = 0;

  await client.query(queryMessage)
    .then(
      (results) => {
        queryResult = JSON.stringify(results[0]);
        var data = results[0];
        data = data[0];
        testForEmptyResponse = JSON.stringify(data)   /** Check if ProdSortNum is empty. If yes then return undefined */

        dataDB = queryResult;   /** Save queryResult in global Variable to work with (return doesnt work yet) */

        console.log(dataDB);
        return queryResult; /* https://developer.mozilla.org/de/docs/Web/JavaScript/Guide/Using_promises   */
        //callback(null, results[0]);
        //console.log(results);
      })
    .catch(console.log)

};

/********************************* Database Call ******************************/
async function callDBupdateStatus(client, queryMessage) {

  await client.query(queryMessage)
    .then(
      (results) => {
        console.log("Update Production Status" + results)
        return results;
      })
    .catch(console.log)

}

/********************************* Call Lambda function CreateCSV ******************************/
async function callCreateCSV(prodOrderNum) {
  let parsed;

  var responseCreateCSV = 0;
  console.log("Called response Create CSV");

  await axios.post('https://2pkivl4tnh.execute-api.eu-central-1.amazonaws.com/prod/createCSV', prodOrderNum)
    .then((res) => {

      console.log("Res.data = " + res.data.body);
      //data = JSON.stringify(res.data)
      var data = JSON.parse(res.data.body);
      url = data.url
      console.log("URL: " + data.url);
      return data.url;
    })
    .catch((error) => {
      console.error(error)
    })
}

/********************************* Update Sales status ******************************/
async function callSalesUpdateStatus(prodOrderNum) {
  let parsed;

  console.log("Called response Create CSV");
  
  var postData = {
    "prodOrderNr":prodOrderNum,
    "statusID": 2, //ID des Kunden
    "statusdescription": "Auftrag eingeplant", //String mit Beschreibung
    
  }

  axios.patch('https://5club7wre8.execute-api.eu-central-1.amazonaws.com/sales/updatestatus', postData)
  .then((res) => {
      console.log(res.data)
      var data = JSON.stringify(res.data)
      data = JSON.parse(data)
      return data
  })
  .then(data => {
      console.log("data: " + data)
  })
  .catch(error => {
      console.log(error)
  })
}

/********************************* Helper Function GET STUFF FROM DB***********/
const selectOrdersFromDB = function (prodOrderNum) {
  var queryMessageNum = ' ';

  for (var i = 0; i < prodOrderNum.length; i++) {
    var obj = prodOrderNum[i];
    if (i < prodOrderNum.length - 1) {
      queryMessageNum += "'" + obj + "'" + " , ";
      callSalesUpdateStatus(obj)
      //console.log(obj.prodOrderNum);
    } else {
      queryMessageNum += "'" + obj + "'";
    }
  }

  var queryMessage = "SELECT * FROM  esi_prod.ProdTable WHERE prodOrderNum IN (" + queryMessageNum + ") ORDER BY endDate, deltaE";
  console.log("Query Message: "+queryMessage);
  return (queryMessage);
};

/********************************* Update Production Status in DB***********/
async function updateProdStatus () {
  //console.log(dataDB)
  dataDB = JSON.parse(dataDB)
  var queryMessageNum = ' ';

  for (var i = 0; i < dataDB.length; i++) {
    var obj = dataDB[i];
    if (i < dataDB.length - 1) {
      queryMessageNum += "'" + obj.prodOrderNum + "'" + " , ";
      callSalesUpdateStatus(obj.prodOrderNum)
      //console.log(obj.prodOrderNum);
    } else {
      queryMessageNum += "'" + obj.prodOrderNum + "'";
    }
  }

  var queryMessage = " UPDATE esi_prod.ProdTable SET prodStatus = 'planned' WHERE prodOrderNum IN (" + queryMessageNum + " );";
  console.log("String updateProdStatus: " + queryMessage)

  return (queryMessage);

}