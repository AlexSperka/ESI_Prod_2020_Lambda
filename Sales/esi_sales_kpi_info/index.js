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

  try {

    //get the number of all business customers   
    await callDB(pool, getAllBusinessCustomers());
    let allBusinessCustomers = res[0].allBusinessCustomers;

    //get the number of all ordinary customers    
    await callDB(pool, getAllOrdinaryCustomers());
    let allOrdinaryCustomers = res[0].allOrdinaryCustomers;

    //get the number of all orders    
    await callDB(pool, getAllOrders());
    let allOrders = res[0].allOrders;

    //get the number of all orders that are (partially) in statusID=1  
    await callDB(pool, getallOrdersinstatusId1());
    let allOrdersinstatusId1 = res[0].allOrdersinstatusId1;

    //get the number of all orders that are (partially) in statusID=2  
    await callDB(pool, getallOrdersinstatusId2());
    let allOrdersinstatusId2 = res[0].allOrdersinstatusId2;

    //get the number of all orders that are (partially) in statusID=3  
    await callDB(pool, getallOrdersinstatusId3());
    let allOrdersinstatusId3 = res[0].allOrdersinstatusId3;

    //get the number of all orders that are (partially) in statusID=4
    await callDB(pool, getallOrdersinstatusId4());
    let allOrdersinstatusId4 = res[0].allOrdersinstatusId4;

    //get the number of all orders that are (partially) in statusID=5 
    await callDB(pool, getallOrdersinstatusId5());
    let allOrdersinstatusId5 = res[0].allOrdersinstatusId5;

    //get the number of all orders that are (partially) in statusID=6
    await callDB(pool, getallOrdersinstatusId6());
    let allOrdersinstatusId6 = res[0].allOrdersinstatusId6;

    //get the the number of all unfinished toStock prodOrderNrs
    await callDB(pool, getProdOrderNrToStock());
    let prodOrderNrToStock = res[0].prodOrderNrToStock;

    //get the the Articlenumber and variants of toStock products that are in stock
    await callDB(pool, getToStockOrderView());
    let ArticleNrs = res;

    const response = {
      statusCode: 200,
      body: {
        "allBusinessCustomers": allBusinessCustomers,
        "allOrdinaryCustomers": allOrdinaryCustomers,
        "allOrders": allOrders,
        "allOrdersinstatusId1": allOrdersinstatusId1,
        "allOrdersinstatusId2": allOrdersinstatusId2,
        "allOrdersinstatusId3": allOrdersinstatusId3,
        "allOrdersinstatusId4": allOrdersinstatusId4,
        "allOrdersinstatusId5": allOrdersinstatusId5,
        "allOrdersinstatusId6": allOrdersinstatusId6,
        "prodOrderNrToStock": prodOrderNrToStock,
        "allAtricleNrs": ArticleNrs
      }
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
  var queryResult = 0;
  await client.query(queryMessage)
    .then(
      (results) => {
        queryResult = results[0];
        return queryResult;
      })
    .then(
      (results) => {
        //console.log(JSON.parse(JSON.stringify(results)));
        res = JSON.parse(JSON.stringify(results));
        //console.log(JSON.parse(JSON.stringify(results[0])));
        return results;
      })
    .catch(console.log);
}

/////////////////////////////////////SQL Querys ///////////////////////////////////////

const getAllBusinessCustomers = function () {
  var queryMessage = "select count(*) as allBusinessCustomers from esi_sales.customer where business=true;";
  console.log(queryMessage);
  return (queryMessage);
};

const getAllOrdinaryCustomers = function () {
  var queryMessage = "select count(*) as allOrdinaryCustomers from esi_sales.customer where business=false;";
  console.log(queryMessage);
  return (queryMessage);
};

const getAllOrders = function () {
  var queryMessage = "select count(*) as allOrders from esi_sales.orderheader;";
  console.log(queryMessage);
  return (queryMessage);
};

const getallOrdersinstatusId1 = function () {
  var queryMessage = "select count(distinct orderNr) as allOrdersinstatusId1 from esi_sales.status where statusID=1;";
  console.log(queryMessage);
  return (queryMessage);
};

const getallOrdersinstatusId2 = function () {
  var queryMessage = "select count(distinct orderNr) as allOrdersinstatusId2 from esi_sales.status where statusID=2;";
  console.log(queryMessage);
  return (queryMessage);
};

const getallOrdersinstatusId3 = function () {
  var queryMessage = "select count(distinct orderNr) as allOrdersinstatusId3 from esi_sales.status where statusID=3;";
  console.log(queryMessage);
  return (queryMessage);
};

const getallOrdersinstatusId4 = function () {
  var queryMessage = "select count(distinct orderNr) as allOrdersinstatusId4 from esi_sales.status where statusID=4;";
  console.log(queryMessage);
  return (queryMessage);
};

const getallOrdersinstatusId5 = function () {
  var queryMessage = "select count(distinct orderNr) as allOrdersinstatusId5 from esi_sales.status where statusID=5;";
  console.log(queryMessage);
  return (queryMessage);
};
const getallOrdersinstatusId6 = function () {
  var queryMessage = "select count(distinct orderNr) as allOrdersinstatusId6 from esi_sales.status where statusID=6;";
  console.log(queryMessage);
  return (queryMessage);
};

const getToStockOrderView = function () {
  var queryMessage = "SELECT SUM(od.quantity) as quantity, od.articleNr, od.motivNr, od.materialNr, od.colorCode FROM esi_sales.orderdetails od, esi_sales.status s where s.prodOrderNr=od.prodOrderNr and s.statusID<=4 and toStock=true group by od.articleNr;";
  console.log(queryMessage);
  return (queryMessage);
};

const getProdOrderNrToStock = function () {
  var queryMessage = "select count(distinct od.prodOrderNr) as prodOrderNrToStock from esi_sales.orderdetails od, esi_sales.status s  where s.statusID<=4 and od.toStock=true;";
  console.log(queryMessage);
  return (queryMessage);
};
