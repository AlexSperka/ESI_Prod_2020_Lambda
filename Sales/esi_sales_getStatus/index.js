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

  const pool = await mysql.createPool(con)

  let statusID = event.statusID;

  try {

    //get all prodOrderNrs in a given StatusID
    await callDB(pool, getstatus(statusID));
    var answer = res;
    const response = {
      statusCode: 200,
      answer
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
  } finally {
    await pool.end();
  }
};

/////////////////////////////////////Call DB without response ///////////////////////////////////////

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
        return results
      })
    .catch(console.log)
}

/////////////////////////////////////SQL Querys //////////////////////////////////////

const getstatus = function (statusID) {
  var queryMessage = "SELECT s.prodOrderNr, s.orderNr, s.statusID, s.Statusdescription, od.colorCode, od.motivNr, od.materialNr, od.quantity from esi_sales.status s, esi_sales.orderdetails od where od.prodOrderNr=s.prodOrderNr and s.statusID='" + statusID + "';";
  console.log(queryMessage);
  return (queryMessage);
};
