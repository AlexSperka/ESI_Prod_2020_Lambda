/********************************* Librarys ***********************************/

const mysql = require('mysql2/promise');
var config = require('./config');
var moment = require("moment-timezone");
const axios = require('axios');


/********************************* Variables **********************************/
var res = ''; /** Response of the DB call */


 var date= moment().format('YYYY-MM-DD');
 var date2 =  moment().format('YYYYMMDD');
 
 let prodOrderNr;
 let orderNr;
 let j; let c;
 let hasPrint;
/********************************* SQL Connection *****************************/

const con = {
   host: config.host,
    user: config.user,
    password: config.password,
    port: config.port,
    connectionLimit: 2
};

const sleep = ms => {
  return new Promise(resolve => {
      setTimeout(resolve, ms)
  })
}


/******************************************************************************/
/********************************* Export Handler *****************************/
exports.handler = async (event, context, callback) => {
const pool = await mysql.createPool(con)
  let orderNr=event.orderNr; 

  
  try {
   
    await callDB(pool, getOrderDetails(orderNr));
    let orderDetails= res;
    JSON.stringify(orderDetails);
   
   

    var newProd ="newProd";
    var lack="lack";
    var newValue1=null;
    var newValue2="";
    
  
   let i;
    for (i in orderDetails) {   
    orderDetails[i][newProd]=newValue1;
     orderDetails[i][lack]=newValue2;
      
    } 



    
    const response = {
      statusCode: 200,
      orderDetails
      
      
    };

    return response;
    

  } 
    catch (error) {
    console.log(error);
    return { "status": "That did not work" };
  } finally {
    await pool.end()
  }

}




/********************************* Database Call ******************************/
async function callDB (client, queryMessage) {

  var queryResult;

  await client.query(queryMessage)
    .then(
      (results) => {
        queryResult = results[0];
        //console.log(results[0]);
        return queryResult; 
      })
    .then(
      (results) => {
        
         res = JSON.parse(JSON.stringify(results));
        
      
        return results
      })
    .catch(console.log)

}

/********************************* Helper Function SELECT Order FROM DB***********/
const getOrderDetails = function (orderNr) {
  var queryMessage = "SELECT prodOrderNr, lineItem, articleNr, colorCode, quantity, price  FROM esi_sales.orderdetails where orderNr='" +  orderNr+  "';"
  //console.log(queryMessage);
  return (queryMessage);
};
