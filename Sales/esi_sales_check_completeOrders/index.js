///////////////////////////////////// IMPORTS ///////////////////////////////////////

const mysql = require('mysql2/promise');
var config = require('./config');
var moment = require("moment-timezone");
const axios = require('axios');


///////////////////////////////////// GLOBALS ///////////////////////////////////////
var res = ''; /** Response of the DB call */

let hasPrint;
let i; let c;
///////////////////////////////////// DATABASE CONNECTION ///////////////////////////////////////

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


/////////////////////////////////////EXPORTS HANDLER///////////////////////////////////////
exports.handler = async (event, context, callback) => {
const pool = await mysql.createPool(con)

 let finishedOrderNR=[];
 
  try {
    let j=0;
    let orderDetails;
  
   // get all OrderNrs with Status=4
    await callDB(pool, getAllOrderNrInStatus4());
    let allorderNrs= res;
    


  //check for every of these orderNrs
   for (i in allorderNrs)
   {
     
     //get the possible max count of ProdOrderNrs for all entrys within every OrderNr 
     await callDB(pool, orderNrMax(allorderNrs));
     let maxorderNr= res[0].maxOrderNr;
   //  console.log(maxorderNr)
    
    //get the actual count of ProdOderNr entrys in StatusID=4 within every OrderNr 
    await callDB(pool, orderNrinStatus4Max(allorderNrs));
    let maxOrderNrstatus4= res[0].maxOrderNrstatus4;
    
    // console.log(maxOrderNrstatus4)
     
     // if possible max and acual count are the same...
    if(maxOrderNrstatus4==maxorderNr){
    
      //...write the OrderNr of the complete Order into an new array at positon j
      finishedOrderNR[j]=allorderNrs[i].orderNr;
        j++;
       console.log(finishedOrderNR);
    }
   }

    for (c in finishedOrderNR)
    
    {
      //get for all complete OrderNrs the table view with (orderNr, statusID, tested)
      await callDB(pool, getCompleteOrdersInStatus4(finishedOrderNR));
      orderDetails= res;
      
    }
    /*
    await callDB(pool, getOrdersInStatus4());
    let orderDetails= res;
 
   */

    
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


const getCompleteOrdersInStatus4 = function (finishedOrderNR) {
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

