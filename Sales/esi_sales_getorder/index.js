///////////////////////////////////// IMPORTS ///////////////////////////////////////

const mysql = require('mysql2/promise');
var config = require('./config');

///////////////////////////////////// GLOBALS ///////////////////////////////////////

var res = '';

///////////////////////////////////// DATABASE CONNECTION ///////////////////////////////////////

const con = {
  host: config.host,
  user: config.user,
  password: config.password,
  port: config.port,
  connectionLimit: 2
};

/////////////////////////////////////EXPORTS HANDLER///////////////////////////////////////

exports.handler = async (event, context, callback) => {
  const pool = await mysql.createPool(con);
  let orderNr = event.orderNr;

  try {

    //get the prodOrderNr, lineItem, articleNr, colorCode, quantity and price of a given orderNr 
    await callDB(pool, getOrderDetails(orderNr));
    let orderDetails = res;
    JSON.stringify(orderDetails);

    const response = {
      statusCode: 200,
      orderDetails
    };

    return response;
  }
  catch (error) {
    console.log(error);
    return {
      statusCode: 400,
      "Error": "Function catched an error"
    };
  }
  finally 
  {
    await pool.end();
  }
};

/////////////////////////////////////Call DB and parsing answer ///////////////////////////////////////

async function callDB(client, queryMessage) {

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
        return results;
      })
    .catch(console.log);
}

/////////////////////////////////////SQL Querys ///////////////////////////////////////

const getOrderDetails = function (orderNr) {
  var queryMessage = "SELECT od.prodOrderNr, od.lineItem, od.articleNr, od.colorCode, od.quantity, od.price FROM esi_sales.orderdetails od NATURAL LEFT JOIN  esi_Resales.retour r WHERE r.prodOrderNr IS NULL and od.orderNr='" + orderNr + "';";
  //console.log(queryMessage);
  return (queryMessage);
};

