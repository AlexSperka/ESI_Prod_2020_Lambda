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

/********************************* Variables **********************************/
var date = 0;
var time = 0;

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
  
    callDB(client, selectOrdersFromDB);
    // asynchCallDB(client, writeOrdersToDB(newOrder, date, time));
  };

/********************************* Database Call ******************************/
const callDB = (client, queryMessage, callback) => {
    client.query(queryMessage,
      function (error, results) {
        callback(null, {
          statusCode: 200,
          body: JSON.stringify({
            data: 'Die Aufträge wurden erfolgreich sortiert!',
            dataReturn: results
          })
        });
      });
  };

/********************************* Helper Function GET STUFF FROM DB***********/
const getOrdersFromDB = function () {
    var queryMessage = 'SELECT * FROM testdb.ProdTable LIMIT 10';
    return (queryMessage);
  };

/********************************* Helper Function GET STUFF FROM DB***********/
const selectOrdersFromDB = function () {
    var queryMessage = "SELECT * FROM  testdb.ProdTable WHERE prodStatus = " + 'open';
    return (queryMessage);
  };
