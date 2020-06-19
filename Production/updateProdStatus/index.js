/**
 * Function gets called by Frontend and updates the production status in prod DB as well as sales status in sales DB 
 * @author Alex Sp
 * @date 2020-06-17
 * @alias    esi_prod_updateProdStatus
 * @memberof ProductionTeamESI
 *
 *
 * @param object, including prodOrderNum which shall be updated
 * {
    "prodOrderNum": "1"
   }
 *
 * @return {String} Return URL where CSV file with next orders can be downloaded
 */

/********************************* Librarys ***********************************/
const mysql = require('mysql2/promise'); /* require mysql - https://npmdoc.github.io/node-npmdoc-mysql2/build/apidoc.html#apidoc.module.mysql2.promise */
const axios = require('axios');

const moment = require("moment-timezone");

/********************************* Consts Var**********************************/
const ORDERLIMIT = 3; /** Define how many orders shall be in one CSV file */

/********************************* Variables **********************************/
var date = 0;
var time = 0;
var dataDB = 0;
var url = '';
var status = '';
var testForEmptyResponse = 'undefined';

var statusCodeSales = 0;
var statusCodeProd = '';

var response = '';

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

/********************************* Sleep Fct *****************************/
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
    data = JSON.parse(data);

    if (typeof data.prodOrderNum !== 'undefined') {

      await callDBupdateStatus(pool, updateProdStatus(data.prodOrderNum));

      await callSalesUpdateStatus(data.prodOrderNum);

      await sleep(500)

      if (statusCodeSales === 200 && statusCodeProd === 200) {
        status = "Der Status wurde erfolgreich in der Datenbank aktualisiert.";
      } 
      // else if(statusCodeSales === 200) {
      //   status = "Der Status wurde erfolgreich in der V&V Datenbank aktualisiert. Bei der Produktionsdatenbank gab es Probleme, möglicherweise liegt dies daran, dass die Nummer nicht in der Datenbank existiert ";
      // } else if (statusCodeProd === 200){
      //   status = "Der Status wurde erfolgreich in der Produktionsdatenbank aktualisiert. Bei der V&V Datenbank gab es Probleme.";
      // }
      else {
        status = "Der Status konnte nicht aktualisiert werden. Möglicherweise liegt dies daran, dass die Nummer nicht in der Datenbank existiert.";
      }
    } else {
      status = "Das hat leider nicht geklappt. Dies könnte daran liegen, dass die eingegebene Nummer nicht das korrekte Format hat";
    }

    response = {
      statusCode: 200,
      body: {
        "status": status
      }
    };

    console.log(response)

  } catch (error) {

    response = {
      statusCode: 400,
      body: {
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
        console.log("Update Production Status");
        console.log(results);
        var query = JSON.stringify(results[0])
        query = JSON.parse(query)
        console.log("Affected Rows in DB: "+query.affectedRows )
        
        if( typeof query.affectedRows !== 'undefined'){ /** Check if Response from DB is valid */
          if(query.affectedRows>0 ){ /** If response is valid and rows are affected by change then statusCodeProd = 200 */
            statusCodeProd = 200;
          } else {
            statusCodeProd = 400;
          }
        } else {
          statusCodeProd = 400;
        }
  
        return results;
      })
    .catch(console.log)

}

/********************************* Call Lambda function CreateCSV ******************************/
async function callSalesUpdateStatus(prodOrderNum) {
  let parsed;

  console.log("Called Sales Update Status");

  var postData = {
    "prodOrderNr": prodOrderNum, //Nummer
    "statusID": '3', //ID des Kunden
    "statusdescription": 'Produktion abgeschlossen',
  }

  axios.patch('https://5club7wre8.execute-api.eu-central-1.amazonaws.com/sales/updatestatus', postData)
    .then((res) => {
      console.log(res.data);
      var data = JSON.stringify(res.data);
      data = JSON.parse(data);
      statusCodeSales = data.statusCode;
      console.log("StatusCodeSales :"+statusCodeSales)
      return data
    })
    .then(data => {
      console.log("data: " + data);
    })
    .catch(error => {
      console.log(error);
    })
}



/********************************* Helper Function GET STUFF FROM DB***********/
const selectOrdersFromDB = function () {
  var queryMessage = "SELECT * FROM  esi_prod.ProdTable WHERE prodStatus =" + "'open'" + "ORDER BY endDate, deltaE" + " LIMIT " + ORDERLIMIT;
  return (queryMessage);
};

/********************************* Update Production Status in DB***********/
const updateProdStatus = function (prodOrderNum) {
  //console.log(dataDB)
  dataDB = JSON.parse(dataDB)
  var queryMessageNum = ' ';

  for (var i = 0; i < dataDB.length; i++) { /** updating all the status for the selected orders in DB */
    var obj = dataDB[i];
    if (i < dataDB.length - 1) {
      queryMessageNum += "'" + obj.prodOrderNum + "'" + " , ";
      //console.log(obj.prodOrderNum);
    } else {
      queryMessageNum += "'" + obj.prodOrderNum + "'";
    }
  }

  var queryMessage = " UPDATE esi_prod.ProdTable SET prodStatus = 'produced' WHERE prodOrderNum IN (" + "'" + prodOrderNum + "'" + " );";
  console.log("String updateProdStatus: " + queryMessage)

  return (queryMessage);

}