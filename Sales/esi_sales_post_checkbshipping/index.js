///////////////////////////////////// IMPORTS ///////////////////////////////////////

const mysql = require('mysql2/promise');
var config = require('./config');

///////////////////////////////////// GLOBALS ///////////////////////////////////////

var res;

///////////////////////////////////// DATABASE CONNECTION ///////////////////////////////////////

const con = {
  host: config.host,
  user: config.user,
  password: config.password,
  port: config.port,
};

/////////////////////////////////////EXPORTS HANDLER///////////////////////////////////////

exports.handler = async (event, context, callback) => {
  const pool = await mysql.createPool(con);

  let tested = true;
  let orderNr = event.orderNr;
  let i;

  try {

    //update orderheader table
    await callinsertDB(pool, orderTested(orderNr));

    //get prodOrderNrs for OrderNr
    await callDB(pool, getProdOrderNrs(orderNr));
    let allOrderNr = res;
    console.log(allOrderNr);
    for (i in allOrderNr) {
      //set tested=true 
      await callinsertDB(pool, updateStatus(allOrderNr, i));
    }

    const response = {
      statusCode: 200,
      body: tested
    };

    console.log(response);
    return response;
  }
  catch (error) {
    console.log(error);
    return {
      statusCode: 400,
      "Error": "Function catched an error"
    };
  }
  finally {
    await pool.end();
  }
};

/////////////////////////////////////Call DB without response ///////////////////////////////////////

async function callinsertDB(client, queryMessage) {
  await client.query(queryMessage)
    .catch(console.log)
};

/////////////////////////////////////Call DB and parsing answer ///////////////////////////////////////

async function callDB(client, queryMessage) {

  var queryResult = 0;
  await client.query(queryMessage)
    .then(
      (results) => {
        queryResult = results[0];
        return queryResult;
      })
    .then(
      (results) => {
        console.log(JSON.parse(JSON.stringify(results)));
        res = JSON.parse(JSON.stringify(results));
        //console.log(JSON.parse(JSON.stringify(results[0])));
        return results;
      })
    .catch(console.log);
}

/////////////////////////////////////SQL Querys ///////////////////////////////////////

const orderTested = function (orderNr) {
  var queryMessage = "UPDATE esi_sales.orderheader SET tested = true WHERE orderNr ='" + orderNr + "';";
  console.log(queryMessage);
  return (queryMessage);
};

const getProdOrderNrs = function (orderNr) {
  var queryMessage = "SELECT prodOrderNr FROM esi_sales.orderdetails where orderNr='" + orderNr + "';";
  //console.log(queryMessage);
  return (queryMessage);
};

const updateStatus = function (allOrderNr, i) {
  var queryMessage = "UPDATE esi_sales.status SET statusID =6, Statusdescription = 'Bestellung geprüft und versandbereit' WHERE (`prodOrderNr` = '" + allOrderNr[i].prodOrderNr + "');";
  console.log(queryMessage);
  return (queryMessage);
};