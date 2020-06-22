/********************************* Librarys ***********************************/

const mysql = require('mysql2/promise');
var config = require('./config');
var moment = require("moment-timezone");
const axios = require('axios');


/********************************* Variables **********************************/
var res; /** Response of the DB call */




 
/********************************* SQL Connection *****************************/

const con = {
    host: config.host,
    user: config.user,
    password: config.password,
    port: config.port,
};




/******************************************************************************/
/********************************* Export Handler *****************************/
exports.handler = async (event, context, callback) => {

const pool = await mysql.createPool(con)


   try{
       
    await callDB(pool,getAllBusinessCustomers());
    let allBusinessCustomers=res[0].allBusinessCustomers;
 
  await callDB(pool,getAllOrdinaryCustomers());
    let allOrdinaryCustomers=res[0].allOrdinaryCustomers;
    
    await callDB(pool,getAllOrders());
    let allOrders=res[0].allOrders;
    
    await callDB(pool,getallOrdersinstatusId1())
    let allOrdersinstatusId1=res[0].allOrdersinstatusId1;
   
    await callDB(pool,getallOrdersinstatusId2());
    let allOrdersinstatusId2=res[0].allOrdersinstatusId2;
   
    await callDB(pool,getallOrdersinstatusId3());
    let allOrdersinstatusId3=res[0].allOrdersinstatusId3;
    
    await callDB(pool,getallOrdersinstatusId4());
    let allOrdersinstatusId4=res[0].allOrdersinstatusId4;
    
    await callDB(pool,getallOrdersinstatusId5());
    let allOrdersinstatusId5=res[0].allOrdersinstatusId5;
    
    await callDB(pool,getallOrdersinstatusId6());
    let allOrdersinstatusId6=res[0].allOrdersinstatusId6;
    
    await callDB(pool,getProdOrderNrToStock());
    let prodOrderNrToStock=res[0].prodOrderNrToStock;  
    
    await callDB(pool,getToStockOrderView());
    let ArticleNrs=res;
    
    
    const response = {
      statusCode: 200,
      body:{
        "allBusinessCustomers": allBusinessCustomers,
        "allOrdinaryCustomers":allOrdinaryCustomers,
        "allOrders":allOrders,
        "allOrdersinstatusId1":allOrdersinstatusId1,
        "allOrdersinstatusId2":allOrdersinstatusId2,
        "allOrdersinstatusId3":allOrdersinstatusId3,
        "allOrdersinstatusId4":allOrdersinstatusId4,
        "allOrdersinstatusId5":allOrdersinstatusId5,
        "allOrdersinstatusId6":allOrdersinstatusId6,
        "prodOrderNrToStock":prodOrderNrToStock,
       
        "allAtricleNrs": ArticleNrs
        
      }
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

        return results
      })
    .catch(console.log)

};

/********************************* Call API TO GET PROD ORDER NR for direct sale ******************************/
async function postToAddOrder(body) {

let parsed;
  
  
  var body = JSON.stringify({body});
  console.log(body)
  await axios.post('https://5club7wre8.execute-api.eu-central-1.amazonaws.com/sales/addorder', body)
    .then((results) => {

      
      
      parsed=JSON.stringify(results.data);
      console.log(parsed)
      res=JSON.parse(parsed);
      res=res.body
      console.log(res);
      
      return results;
      
    })
    .catch((error) => {
      console.error(error)
    })
}



/********************************* Helper Function SELECT Order FROM DB***********/


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
