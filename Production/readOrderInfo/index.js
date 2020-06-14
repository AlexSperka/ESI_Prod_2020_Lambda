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

// // If 'client' variable doesn't exist
// if (typeof client === 'undefined') {
//   // Connect to the MySQL database
//   var client = mysql.createConnection({
//     host: process.env.RDS_LAMBDA_HOSTNAME,
//     user: process.env.RDS_LAMBDA_USERNAME,
//     password: process.env.RDS_LAMBDA_PASSWORD,
//     port: process.env.RDS_LAMBDA_PORT,
//     database: process.env.RDS_DATABASE,
//   });

//   client.connect();
// }

/******************************************************************************/
/********************************* Export Handler *****************************/
exports.handler = async (event, context, callback) => {

  const pool = await mysql.createPool(settings)

  console.log('Received event:', JSON.stringify(event, null, 2));
  let orderNumber = JSON.stringify(event);
  orderNumber = JSON.parse(orderNumber);
  // console.log('Color Name: ', orderNumber.body.colorName);

  //  compareColor();

  console.log("test return");


  try {

    const r = await callDB(pool, selectProdOrderFromDB(orderNumber));
    console.log(r)
    await sleep(8000)
    

    const response = {
      statusCode: 200,
      body: res
    };

    console.log(response);
    return response;
    //return { "url": data };

  } catch (error) {
    console.log(error);
    return { "status": "That did not work" };
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
  var queryMessage = 'SELECT * FROM testdb.ProdTable LIMIT 10';
  return (queryMessage);
};
