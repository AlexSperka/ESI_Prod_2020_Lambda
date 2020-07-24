///////////////////////////////////// IMPORTS ///////////////////////////////////////

const mysql = require('mysql2/promise');
var config = require('./config');

///////////////////////////////////// DATABASE CONNECTION /////////////////////////////////////

const con = {
  host: config.host,
  user: config.user,
  password: config.password,
  port: config.port,
};

/////////////////////////////////////EXPORTS HANDLER///////////////////////////////////////

exports.handler = async (event, context, callback) => {
  const pool = await mysql.createPool(con);

  //get the event data
  let prodOrderNr = event.prodOrderNr;
  let statusID = event.statusID;
  let Statusdescription = event.statusdescription;

  try {

    //GET OLD ORDERINFOS
    await callinsertDB(pool, updateStatus(statusID, Statusdescription, prodOrderNr));

    const response = {
      statusCode: 200,
      message: 'Auftrag erfolgreich upgedated.'
    };
    console.log(response);
    return response;
  }
  catch (error) {
    console.log(error);
    return 
    {
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
    .catch(console.log);
}

/////////////////////////////////////SQL Querys ///////////////////////////////////////

const updateStatus = function (statusID, Statusdescription, prodOrderNr) {
  var queryMessage = "UPDATE esi_sales.status SET statusID = '" + statusID + "', Statusdescription = '" + Statusdescription + "' WHERE (`prodOrderNr` = '" + prodOrderNr + "');";
  console.log(queryMessage);
  return (queryMessage);
};
