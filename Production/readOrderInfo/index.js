/**
 * Function to add new Orders to production table
 * @author Alex Sp
 * @date 2020-06-17 
 * @alias    esi_prod_readOrderInfo
 * @memberof ProductionTeamESI
 *
 * Option 1:
 * @param orderStatus (open, planned, produced) to get only the queries with the flag
  {
    "orderStatus": "planned"
  }
* @return {Object} get only the queries with the flag
*
* Option 2: 
* @param ProdOrderNum to get only the order with this prodOrderNum back
  {
    "prodOrderNum": "'10'"
  }
* @return {Object} get only the order with this prodOrderNum back
*
* Option 3: empty - complete database results will be returned
* @return {Object} returns everything
*/

/********************************* Librarys ***********************************/
const mysql = require('mysql2/promise'); /* require mysql - https://npmdoc.github.io/node-npmdoc-mysql2/build/apidoc.html#apidoc.module.mysql2.promise */


/********************************* Variables **********************************/
var res = ''; /** Response of the DB call */
const ORDERLIMIT = 3; /** Define how many orders shall be in one CSV file */
var response = '';

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

  // console.log('Color Name: ', orderNumber.body.colorName);

  //  compareColor();

  var r = '';

  try {
    let orderNumber = JSON.stringify(event);
    orderNumber = JSON.parse(orderNumber);

    if (typeof orderNumber.prodOrderNum != 'undefined') {
      r = await callDB(pool, selectProdOrderFromDB(orderNumber));

      var query = JSON.stringify(res)
      query = JSON.parse(query)
      if (typeof query[0] === 'undefined') {
        response = {
          statusCode: 400,
          body: {
            "status": "Diese ProdOrderNum existiert nicht in der Produktionsdatenbank.",
          }
        }
        return response
      }
    }
    else if (typeof orderNumber.orderStatus != 'undefined') {
      r = await callDB(pool, selectOrdersFromDB(orderNumber));
    } else {
      r = await callDB(pool, getAllOrdersFromDB());
    }

    response = {
      statusCode: 200,
      body: res
    };

    await sleep(2000)

    console.log(response);
    return response;
    //return { "url": data };

  } catch (error) {

    response = {
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
async function callDB(client, queryMessage) {

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
  var queryMessage = "SELECT prodOrderNum, orderNumber, lineItem, articleNumber, quantity FROM  esi_prod.ProdTable WHERE prodOrderNum =" + orderNumber.prodOrderNum + "  LIMIT 1 ";
  console.log(queryMessage);
  return (queryMessage);
};

/********************************* Helper Function GET STUFF FROM DB***********/
const selectOrdersFromDB = function (order) {

  var queryMessage = "SELECT prodOrderNum, orderNumber, lineItem, endDate, articleNumber, colorHEX, prodStatus, quantity, deltaE FROM  esi_prod.ProdTable WHERE prodStatus = '" + order.orderStatus + "'" + " ORDER BY endDate, deltaE ";
  console.log(queryMessage)
  return (queryMessage);
};

/********************************* Helper Function GET STUFF FROM DB***********/
const getAllOrdersFromDB = function () {

  var queryMessage = "SELECT prodOrderNum, orderNumber, lineItem, endDate, articleNumber, colorHEX, prodStatus, quantity, deltaE FROM  esi_prod.ProdTable ORDER BY endDate, deltaE ";
  console.log(queryMessage)
  return (queryMessage);
};
