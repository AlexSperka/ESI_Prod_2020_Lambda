/********************************* Librarys ***********************************/

const mysql = require('mysql2/promise');
var config = require('./config');
var moment = require("moment-timezone");
const axios = require('axios');


/********************************* Variables **********************************/
var res; /** Response of the DB call */
var answer;


 let orderdetailsRetour;
 let newProd; 
 
 let j;
 var date= moment().format('YYYY-MM-DD');
 var date2 =  moment().format('YYYYMMDD');
 
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

let body=[];
let commentary;



let jObj = JSON.stringify(event.body);
jObj = JSON.parse(jObj);
newProd=jObj[0].newProd;
  
  console.log(newProd)
  try {
      
    
    //GET OLD ORDERINFOS
    await callDB(pool, getOldOrderDetails(jObj));
     orderdetailsRetour=res[0];
     let oldOrderNr=orderdetailsRetour.orderNr
     
    
    await callDB(pool, getCustomer(orderdetailsRetour));
    let customerID=res[0].customerID;
  console.log(customerID)
    
////////////////////////////////lack,customerID,prodOrderNr,newProd

    if (newProd==0) {
        
        

       for ( j in jObj)
        {
         let c =j;
           if (c==0){     
           
  
            commentary= "Retoure/n für ProdOrderNr:"+ jObj[j].prodOrderNr +""
            let newProdOrderNr = null;

           
            await callinsertDB(pool, insertNewRetour(customerID,jObj,newProd,c));
           
            //await callinsertDB(pool, updateOrderNr(commentary,orderdetailsRetour,newProdOrderNr));
          await callinsertDB(pool, addCommentary(commentary,oldOrderNr));
           }
            else
           {
            commentary= jObj[j].prodOrderNr;
            console.log(commentary)
               await callinsertDB(pool, insertNewRetour(customerID,jObj,newProd,c));
               await callinsertDB(pool, addCommentary(commentary,oldOrderNr));
           }
   
        } answer='Die Retoure/n wurde vermerkt. Der Kunde wünscht kein Ersatz. Eine Rückzahlung wird in Auftrag gegeben.';
    }
     //THEORETISCHER CALL FÜR API DER RECHNUNGSABTEILUNG
     
    
    

else{


for ( j in jObj)
        {
        let c=j;
       
        if (c==0){     
            newProd=1;
            await callDB(pool, getAllOldOrderDetails(jObj,c));
            orderdetailsRetour=res;
            console.log(orderdetailsRetour)
            body[c]={"colorCode": orderdetailsRetour[0].colorCode, "materialNr": orderdetailsRetour[0].materialNr,"motivNr": orderdetailsRetour[0].motivNr,"toStock": false,"lineItem": c,"quantity":orderdetailsRetour[0].quantity ,"customerID": customerID};
        
            commentary= "Retoure/n für ProdOrderNr:"+ jObj[j].prodOrderNr +""

            await callinsertDB(pool, insertNewRetour(customerID,jObj,newProd,c));
            await callinsertDB(pool, addCommentary(commentary,oldOrderNr));
          
           }
            else
           {
             newProd=1; 
             await callDB(pool, getAllOldOrderDetails(jObj,c));
            orderdetailsRetour=res;
        
           body[c]={"colorCode": orderdetailsRetour[0].colorCode, "materialNr": orderdetailsRetour[0].materialNr,"motivNr": orderdetailsRetour[0].motivNr,"toStock": false,"lineItem": c,"quantity":orderdetailsRetour[0].quantity ,"customerID": customerID};
             commentary= jObj[j].prodOrderNr;
            console.log(commentary)
               await callinsertDB(pool, insertNewRetour(customerID,jObj,newProd,c));
               await callinsertDB(pool, addCommentary(commentary,oldOrderNr));
           }
        }

     await postToAddOrder(body);
    let newOrderNr=res.orderNr
    
    commentary= "Neue OrderNr: " + newOrderNr;
    console.log(commentary)
    await callinsertDB(pool, addCommentary(commentary,oldOrderNr));
  
    answer="Die Ordernummer für die neu produzierten Waren lautet: " + newOrderNr + ".";
    
    
    
}
  
    const response = {
      statusCode: 200,
      answer
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
/********************************* Database Call Withut response ******************************/

async function callinsertDB (client, queryMessage) {

 

  await client.query(queryMessage)
    
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


const getOldOrderDetails = function (jObj) {
  var queryMessage = "SELECT * FROM esi_sales.orderdetails where prodOrderNr='" +  jObj[0].prodOrderNr + "';";
 console.log(queryMessage);
  return (queryMessage);
};
const getAllOldOrderDetails = function (jObj, c) {
  var queryMessage = "SELECT * FROM esi_sales.orderdetails where prodOrderNr='" +  jObj[c].prodOrderNr + "';";
 console.log(queryMessage);
  return (queryMessage);
};

const insertNewRetour = function (customerID,jObj,newProd,c) {
  var queryMessage = "insert into esi_sales.retour (prodOrderNr, customerID , lack, newProd) VALUES ('" + jObj[c].prodOrderNr +"', " + customerID + ", '" + jObj[c].lack + "', '" + newProd + "');";
 console.log(queryMessage);
  return (queryMessage);
};

const addCommentary = function (commentary,oldOrderNr) {
  var queryMessage = "UPDATE esi_sales.orderheader SET commentary = CONCAT(commentary, '" + commentary + ", ')  WHERE (`orderNr` = '" +oldOrderNr + "');";
 console.log(queryMessage);
  return (queryMessage);
};

const getCustomer = function (orderdetailsRetour) {
  var queryMessage = "SELECT customerID FROM esi_sales.orderheader where orderNr='" +  orderdetailsRetour.orderNr + "';";
  console.log(queryMessage);
  return (queryMessage);
};

