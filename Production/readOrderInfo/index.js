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
const mysql = require('mysql2/promise'); /* require mysql - https://npmdoc.github.io/node-npmdoc-mysql2/build/apidoc.html#apidoc.module.mysql2.promise */


/********************************* Variables **********************************/
var res = ''; /** Response of the DB call */
const ORDERLIMIT = 3; /** Define how many orders shall be in one CSV file */

/********************************* SQL Connection *****************************/

const settings = {
  host: process.env.RDS_LAMBDA_HOSTNAME,
  user: process.env.RDS_LAMBDA_USERNAME,
  password: process.env.RDS_LAMBDA_PASSWORD,
  port: process.env.RDS_LAMBDA_PORT,
  database: process.env.RDS_DATABASE,
  connectionLimit: 2
}

const sleep = ms => {
  return new Promise(resolve => {
      setTimeout(resolve, ms)
  })
}

/******************************************************************************/
/********************************* Export Handler *****************************/
exports.handler = async (event, context, callback) => {

  const pool = await mysql.createPool(settings)

  console.log('Received event:', JSON.stringify(event, null, 2));
  let orderNumber = JSON.stringify(event);
  
  // console.log('Color Name: ', orderNumber.body.colorName);

  //  compareColor();

  var r = '';

  try {
    
    orderNumber = JSON.parse(orderNumber);
    
    if( typeof orderNumber.prodOrderNum != 'undefined' ) {
      r = await callDB(pool, selectProdOrderFromDB(orderNumber));
    }
    else{
      r = await callDB(pool, getOrdersFromDB());
    }
    
    console.log(r)
    await sleep(2500)

    const response = {
      statusCode: 200,
      body: res
    };

    console.log(response);
    return response;

  } catch (error) {

    const response = {
      statusCode: 400,
      body: {
        "status": "That did not work",
        "error": error,
      }
    };

    console.log(response);
    return response;
  } finally {
    await pool.end()
  }

}


/********************************* Database Call ******************************/
async function callDB (client, queryMessage) {

  var queryResult = 0;

  await client.query(queryMessage)
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
    
        console.log("Return " + results);
        res = results;
        return results
      })
    .catch(console.log)

};

/********************************* Helper Function SELECT Order FROM DB***********/
const selectProdOrderFromDB = function (orderNumber) {
  var queryMessage = "SELECT prodOrderNum, articleNumber, quantity FROM  testdb.ProdTable WHERE prodOrderNum =" + orderNumber.prodOrderNum + "  LIMIT 1 ";
  console.log(queryMessage);
  return (queryMessage);
};

/********************************* Helper Function GET STUFF FROM DB***********/
const getOrdersFromDB = function () {
  var queryMessage = "SELECT prodOrderNum, endDate, colorHEX, ProdSortNum, prodStatus, quantity, deltaE FROM  testdb.ProdTable WHERE prodStatus ='planned' " + " ORDER BY endDate, deltaE ";
  console.log(queryMessage)
  return (queryMessage);
};
