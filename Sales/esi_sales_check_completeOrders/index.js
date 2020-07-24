///////////////////////////////////// IMPORTS ///////////////////////////////////////

const mysql = require('mysql2/promise');
var config = require('./config');

///////////////////////////////////// GLOBALS ///////////////////////////////////////

var res = ''; /** Response of the DB call */
let i;
let c;

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

  let finishedOrderNR = [];

  try {
    let j = 0;
    let orderDetails = [];

    // get all OrderNrs with Status=4
    await callDB(pool, getAllOrderNrInStatus4());
    let allorderNrs = res;

    //check for every of these orderNrs
    for (i in allorderNrs) {
      //get the possible max count of ProdOrderNrs for all entrys within every OrderNr 
      await callDB(pool, orderNrMax(allorderNrs));
      let maxorderNr = res[0].maxOrderNr;

      //get the actual count of ProdOderNr entrys in StatusID=4 within every OrderNr 
      await callDB(pool, orderNrinStatus4Max(allorderNrs));
      let maxOrderNrstatus4 = res[0].maxOrderNrstatus4;

      // if possible max and acual count are the same...
      if (maxOrderNrstatus4 == maxorderNr) {

        //...write the OrderNr of the complete Order into an new array at positon j
        finishedOrderNR[j] = allorderNrs[i].orderNr;
        j++;

      }
    }

    await callDB(pool, getAllOrderNrInStatus5());
    allorderNrs = res;

    //check for every of these orderNrs
    for (i in allorderNrs) {
      //get the possible max count of ProdOrderNrs for all entrys within every OrderNr 
      await callDB(pool, orderNrMax(allorderNrs));
      let maxorderNr = res[0].maxOrderNr;

      //get the actual count of ProdOderNr entrys in StatusID=4 within every OrderNr 
      await callDB(pool, orderNrinStatus5Max(allorderNrs));
      let maxOrderNrstatus5 = res[0].maxOrderNrstatus5;

      // if possible max and acual count are the same...
      if (maxOrderNrstatus5 == maxorderNr) {

        j = finishedOrderNR.length;
        console.log("arraylänge:" + j);

        //...write the OrderNr of the complete Order into an new array at positon j
        finishedOrderNR[j] = allorderNrs[i].orderNr;

        console.log(finishedOrderNR);
      }
    }

    for (c in finishedOrderNR) {
      console.log(finishedOrderNR);
      //get for all complete OrderNrs the table view with (orderNr, statusID, tested)
      await callDB(pool, getCompleteOrdersInStatus4and5(finishedOrderNR, c));
      orderDetails[c] = res[0];
      console.log(orderDetails);
    }
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
  finally {
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


const getCompleteOrdersInStatus4and5 = function (finishedOrderNR, c) {
  var queryMessage = "SELECT s.orderNr, s.statusID, oh.tested FROM esi_sales.orderheader oh,esi_sales.orderdetails od ,  esi_sales.status s where oh.orderNr=od.orderNr and od.prodOrderNr=s.prodOrderNr and s.orderNr='" + finishedOrderNR[c] + "' group by s.orderNr;";
  //console.log(queryMessage);
  return (queryMessage);
};

const getAllOrderNrInStatus4 = function () {
  var queryMessage = "SELECT orderNr from esi_sales.status where statusID=4 group by orderNr;";
  //console.log(queryMessage);
  return (queryMessage);
};

const orderNrMax = function (allorderNrs) {
  var queryMessage = "SELECT COUNT(*) as maxOrderNr FROM esi_sales.status where orderNr='" + allorderNrs[i].orderNr + "';";
  //console.log(queryMessage);
  return (queryMessage);
};

const orderNrinStatus4Max = function (allorderNrs) {
  var queryMessage = "SELECT COUNT(*) as maxOrderNrstatus4 FROM esi_sales.status where orderNr='" + allorderNrs[i].orderNr + "' and statusID=4;";
  //console.log(queryMessage);
  return (queryMessage);
};

const getAllOrderNrInStatus5 = function () {
  var queryMessage = "SELECT orderNr from esi_sales.status where statusID=5 group by orderNr;";
  //console.log(queryMessage);
  return (queryMessage);
};

//get the number of all  in 
const orderNrinStatus5Max = function (allorderNrs) {
  var queryMessage = "SELECT COUNT(*) as maxOrderNrstatus5 FROM esi_sales.status where orderNr='" + allorderNrs[i].orderNr + "' and statusID=5;";
  //console.log(queryMessage);
  return (queryMessage);
};