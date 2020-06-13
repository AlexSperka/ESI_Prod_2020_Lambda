/**
 * Function to get Orders from production table and sort them by color (light to dark), shipping date and production status
 * 
 * @alias    esi_prod_sortOrders
 * @memberof ProductionTeamESI
 *
 * @fires   esi_prod_callCSV
 *
 * @param none, TBD later
 *
 * @return {String} Return URL where CSV file with next orders can be downloaded
 */

/********************************* Librarys ***********************************/
const mysql = require('mysql2'); /* require mysql - https://npmdoc.github.io/node-npmdoc-mysql2/build/apidoc.html#apidoc.module.mysql2.promise */
const axios = require('axios');

const moment = require("moment-timezone");

/********************************* Variables **********************************/
var date = 0;
var time = 0;
var dataDB = 0;
var url = 0;

const ORDERLIMIT = 3; /** Define how many orders shall be in one CSV file */

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
exports.handler = async (event, context, callback) => {

  // var date = moment();
  time = "\'" + moment().format('HH:mm:ss') + "\'";  //get UTC Time
  date = "\'" + moment().format('DD.MM.YYYY') + "\'";
  console.log("date & time UTC: " + time + " and " + date);

  console.log('Received event:', JSON.stringify(event, null, 2));
  let data = JSON.stringify(event);
  data = JSON.parse(data);  /** Unused right now, for later POST implementations when handing over parameters */

  context.callbackWaitsForEmptyEventLoop = false;

  try {

    await callDB(client, selectOrdersFromDB()); /** Get 10 entries ordered by date, delta e and prod status */

    await callCreateCSV(dataDB);

    client.close();

    return { "url": url };
    //return { "url": data };

  } catch (error) {
    console.log(error);
    return { "url": "That did not work" };
  }

}

/********************************* Database Call ******************************/
async function callDB(client, queryMessage) {

  var queryResult = 0;

  await client.promise().query(queryMessage)
    .then(
      (results) => {
        queryResult = JSON.stringify(results[0]);
        //console.log(JSON.stringify(results[0]))
        dataDB = queryResult;
        return queryResult; /* https://developer.mozilla.org/de/docs/Web/JavaScript/Guide/Using_promises   */
        //callback(null, results[0]);
        //console.log(results);
      })
    .catch(console.log)

  await client.promise().query(updateProdStatus())
    .then(
      (results) => {
        console.log("Update Production Status" + results)
        return results;
      })
    .catch(console.log)

};

/********************************* Call Lambda function CreateCSV ******************************/
async function callCreateCSV(data) {
  let parsed;

  var responseCreateCSV = 0;
  console.log("Called response Create CSV");

  await axios.post('https://2pkivl4tnh.execute-api.eu-central-1.amazonaws.com/prod/createCSV', data)
    .then((res) => {

      console.log("Res.data = " + res.data.body);
      //data = JSON.stringify(res.data)
      data = JSON.parse(res.data.body);
      url = data.url
      console.log("URL: " + data.url);
      return data.url;
    })
    .catch((error) => {
      console.error(error)
    })
}

/********************************* Helper Function GET STUFF FROM DB***********/
const selectOrdersFromDB = function () {
  var queryMessage = "SELECT * FROM  testdb.ProdTable WHERE prodStatus =" + "'open'" + "ORDER BY endDate, deltaE" + " LIMIT " + ORDERLIMIT;
  return (queryMessage);
};

/********************************* Update Production Status in DB***********/
const updateProdStatus = function () {
  //console.log(dataDB)
  dataDB = JSON.parse(dataDB)
  var queryMessageNum = ' ';

  for (var i = 0; i < dataDB.length; i++) {
    var obj = dataDB[i];
    if (i < dataDB.length - 1) {
      queryMessageNum += "'" + obj.prodOrderNum + "'" + " , ";
      //console.log(obj.prodOrderNum);
    } else {
      queryMessageNum += "'" + obj.prodOrderNum + "'";
    }
  }

  var queryMessage = " UPDATE testdb.ProdTable SET prodStatus = 'planned' WHERE prodOrderNum IN (" + queryMessageNum + " );";
  console.log("String updateProdStatus: " + queryMessage)

  return (queryMessage);

}