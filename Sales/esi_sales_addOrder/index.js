/********************************* Librarys ***********************************/

const mysql = require('mysql2/promise');
var config = require('./config');
var moment = require("moment-timezone");
const axios = require('axios');


/********************************* Variables **********************************/
var res = ''; /** Response of the DB call */


 var date= moment().format('YYYY-MM-DD');
 var date2 =  moment().format('YYYYMMDD');
 
 let prodOrderNr
 let orderNr;
 let j; let c;
 let hasPrint;
/********************************* SQL Connection *****************************/

const con = {
    host: 'esi-vv.cgy9jqxv1ek7.us-east-1.rds.amazonaws.com',
    user: 'root',
    password: 'b%F]IFifu<ZyKenDA0l',
    port: '3306',
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


let jObj = JSON.stringify(event);
jObj = JSON.parse(jObj);

  //console.log('Received event:', JSON.stringify(event, null, 2));
 

  try {
    
    await callDB(pool, countOrderDetails());
      let detailscounts= res.detailscounts;
     

      
    await callDB(pool, countOrderHeaders());
      let counts = res.counts;

      for (j in jObj.body)
      {   
        c = j;  
          if (jObj.body[c].motivNr==null) 
              {hasPrint=false}
          else{hasPrint=true}
        
        
    
        //Check if the ArtNr already exists
        await callDB(pool, countExistingArtNr(jObj, c));
        let articleNrexists=res.articleNrexists;
        
        await callDB(pool, maxArticleNr());
        let newArtNr=res.max;  
          
          /*await callDB(pool, maxArticleNr());
          let newArtNr=res.max;*/
          
          console.log(hasPrint)
   
          // CHECK IF ORDER GOES TO STOCK
          if(jObj.body[0].toStock==false){
            //console.log( articleNrexists, business)
            
                    //Check if order belongs to business 
          await callDB(pool, detectBusiness(jObj));
          let business=res.business;

          console.log(business,counts,detailscounts);
        
          if(business==1){
                    orderNr='B-' + date2 +'-' + counts;}
          else if(business==0){
                    orderNr="C-" + date2 + "-" + counts;}  
   
    
            
             
            console.log("articleNrexists= "+articleNrexists, "business= " + business );
             
            if(articleNrexists==0 && business==1)// ARTIKELNUMMER NOT EXISTING
            {
              //CREATE NEW ARTICLENR 
              newArtNr++; //COUNT UP THE NUMBER 
               
               console.log("newArtNr= " +newArtNr);
              
              await callinsertDB(pool,createNewArtNr(jObj, newArtNr, c));
              console.log("newArtNr after insert= " +newArtNr);
              
              //CREATE ORDERHEADER
             
              if(c==0)
                { 
                  console.log("C= "+c );
                  detailscounts++;
                   console.log(detailscounts)  
                    // CREATE ORDERHEADER   
                    //console.log("orderNr= " +orderNr);
                    await callinsertDB(pool,createNewOrderHeader(jObj, orderNr, c)); 
                    //console.log("orderNr after insert= " +orderNr);
                    
                    // GET PRODORDERNR

                   await getProdOrd(jObj, orderNr, hasPrint,newArtNr, c);
                    
                    let prodOrderNr= res;
                     
                     prodOrderNr=prodOrderNr.prodOrderNr;
                     console.log(prodOrderNr);
                    
                   
                    // CREATE ORDERDETAILS
                    await callinsertDB(pool,createOrderDetails (jObj,detailscounts,prodOrderNr, newArtNr, orderNr, hasPrint, c));
                }
              else if(c>0)
                { 
                  //console.log("articleNrexists= "+articleNrexists );
                  console.log(detailscounts)
                  detailscounts++;
                    console.log(detailscounts)
                        
                    // GET PRODORDERNR

                   await getProdOrd(jObj, orderNr, hasPrint,newArtNr, c);
                    let prodOrderNr= res;
                     prodOrderNr=prodOrderNr.prodOrderNr;
                     console.log(prodOrderNr);
                    
                    // CREATE ORDERDETAILS
                    await callinsertDB(pool, createOrderDetails (jObj,detailscounts,prodOrderNr, newArtNr, orderNr, hasPrint, c));
                }
       
            }
            else if(articleNrexists==0 && business==0)// ARTIKELNUMMER EXISTIERT NICHT
            {
              newArtNr=10000001;
              
              if(c==0)
                { console.log("C= "+c );
                  
                  detailscounts++;
                   console.log(detailscounts)  
                    
                    
                    // CREATE ORDERHEADER   
                    
                    await callinsertDB(pool,createNewOrderHeader(jObj, orderNr, c)); 


                    // GET PRODORDERNR

                   await getProdOrd(jObj, orderNr, hasPrint,newArtNr, c);
                    let prodOrderNr= res;
                     prodOrderNr=prodOrderNr.prodOrderNr;

                     console.log(prodOrderNr);
                    
                   
                    // CREATE ORDERDETAILS
                    await callinsertDB(pool,createOrderDetails (jObj,detailscounts,prodOrderNr, newArtNr, orderNr, hasPrint, c));
                }
              else if(c>0)
                { //console.log("articleNrexists= "+articleNrexists );
                  console.log(detailscounts);
                  detailscounts++;
                    console.log(detailscounts);
                        
                    // GET PRODORDERNR

                   await getProdOrd(jObj, orderNr, hasPrint,newArtNr, c);
                    let prodOrderNr= res;
                     prodOrderNr=prodOrderNr.prodOrderNr;
                     console.log(prodOrderNr);
                    
                    // CREATE ORDERDETAILS
                    await callinsertDB(pool, createOrderDetails (jObj,detailscounts,prodOrderNr, newArtNr, orderNr, hasPrint, c));
                }
            }
            else if(articleNrexists==1 && business==1)  
            {     
              console.log(business,counts,detailscounts);
              await callDB(pool, getArtNr(jObj, c));
              newArtNr=res; // EVTL PROBLEM
              newArtNr=newArtNr.articleNr
              
              if(c==0)
                { console.log("C= "+c );
                  
                  detailscounts++;
                   console.log(detailscounts);  
                    
                    // CREATE ORDERHEADER   
                    
                    await callinsertDB(pool,createNewOrderHeader(jObj, orderNr, c)); 


                    // GET PRODORDERNR

                   await getProdOrd(jObj, orderNr, hasPrint,newArtNr, c);
                    let prodOrderNr= res;
                     prodOrderNr=prodOrderNr.prodOrderNr;

                     console.log(prodOrderNr);
                    
                   
                    // CREATE ORDERDETAILS
                    await callinsertDB(pool,createOrderDetails (jObj,detailscounts,prodOrderNr, newArtNr, orderNr, hasPrint, c));
                }
              else if(c>0)
                { //console.log("articleNrexists= "+articleNrexists );
                 detailscounts++;
                   console.log(detailscounts);  
                        
                    // GET PRODORDERNR

                   await getProdOrd(jObj, orderNr, hasPrint,newArtNr, c);
                    let prodOrderNr= res;
                     prodOrderNr=prodOrderNr.prodOrderNr;
                     console.log(prodOrderNr);
                    
                    // CREATE ORDERDETAILS
                    await callinsertDB(pool, createOrderDetails (jObj,detailscounts,prodOrderNr, newArtNr, orderNr, hasPrint, c));
                }
              
            }
           else if(articleNrexists==1 && business==0)  
            {     
              
              newArtNr=10000001
              
              if(c==0)
                { console.log("C= "+c );
                  
                  detailscounts++;
                   console.log("detailscounts nach addition c=0= " + detailscounts);  
                    
                    // CREATE ORDERHEADER   
                    
                    await callinsertDB(pool,createNewOrderHeader(jObj, orderNr, c)); 


                    // GET PRODORDERNR

                   await getProdOrd(jObj, orderNr, hasPrint,newArtNr, c);
                    let prodOrderNr= res;
                     prodOrderNr=prodOrderNr.prodOrderNr;

                     console.log(prodOrderNr);
                    
                   
                    // CREATE ORDERDETAILS
                    await callinsertDB(pool,createOrderDetails (jObj,detailscounts,prodOrderNr, newArtNr, orderNr, hasPrint, c));
                }
              else if(c>0)
                { //console.log("articleNrexists= "+articleNrexists );
                 detailscounts++;
                   console.log("detailscounts nach addition c>0= " + detailscounts);  
                        
                    // GET PRODORDERNR

                   await getProdOrd(jObj, orderNr, hasPrint,newArtNr, c);
                    let prodOrderNr= res;
                     prodOrderNr=prodOrderNr.prodOrderNr;
                     console.log(prodOrderNr);
                    
                    // CREATE ORDERDETAILS
                    await callinsertDB(pool, createOrderDetails (jObj,detailscounts,prodOrderNr, newArtNr, orderNr, hasPrint, c));
                }
              
            }
        }
        
          else
          {
      
             if (articleNrexists==0){
               
              newArtNr++;
              console.log("newArtNr= " +newArtNr);
               
              await callinsertDB(pool,createNewArtNr(jObj, newArtNr, c));
              console.log("newArtNr after insert= " +newArtNr);
              
              //CREATE NEW ORDERDETAIL
              if(c==0)
                      { 
                        console.log("C= "+c );
                        detailscounts++;
                         console.log(detailscounts)  
                          
                          // GET PRODORDERNR
      
                         await getProdOrdToStock(jObj, hasPrint,newArtNr, c);
                          
                          let prodOrderNr= res;
                           
                           prodOrderNr=prodOrderNr.prodOrderNr;
                           console.log(prodOrderNr);
                          
                         
                          // CREATE ORDERDETAILS
                          await callinsertDB(pool,createOrderDetailsToStock (jObj,detailscounts,prodOrderNr, newArtNr, hasPrint, c));
                      }
                    else if(c>0)
                      { 
                        
                        console.log(detailscounts)
                        detailscounts++;
                          console.log(detailscounts)
                              
                          // GET PRODORDERNR
      
                         await getProdOrdToStock(jObj, hasPrint,newArtNr, c);
                          let prodOrderNr= res;
                           prodOrderNr=prodOrderNr.prodOrderNr;
                           console.log(prodOrderNr);
                          
                          // CREATE ORDERDETAILS
                          await callinsertDB(pool, createOrderDetailsToStock (jObj,detailscounts,prodOrderNr, newArtNr, hasPrint, c));
                      }
              
              
             }
             
             else
             {
              await callDB(pool, getArtNr(jObj, c));
              newArtNr=res; // EVTL PROBLEM
              newArtNr=newArtNr.articleNr;
              
              if(c==0)
                      { 
                        console.log("C= "+c );
                        detailscounts++;
                         console.log(detailscounts)  
                          
                          // GET PRODORDERNR
      
                         await getProdOrdToStock(jObj, hasPrint,newArtNr, c);
                          
                          let prodOrderNr= res;
                           
                           prodOrderNr=prodOrderNr.prodOrderNr;
                           console.log(prodOrderNr);
                          
                         
                          // CREATE ORDERDETAILS
                          await callinsertDB(pool,createOrderDetailsToStock (jObj,detailscounts,prodOrderNr, newArtNr, hasPrint, c));
                      }
                    else if(c>0)
                      { 
                        
                        console.log(detailscounts)
                        detailscounts++;
                          console.log(detailscounts)
                              
                          // GET PRODORDERNR
      
                         await getProdOrdToStock(jObj, hasPrint,newArtNr, c);
                         
                          let prodOrderNr= res;
                           prodOrderNr=prodOrderNr.prodOrderNr;
                           console.log(prodOrderNr);
                          
                          // CREATE ORDERDETAILS
                          await callinsertDB(pool, createOrderDetailsToStock (jObj,detailscounts,prodOrderNr, newArtNr, hasPrint, c));
                      }
             }
          }  
    }


    
    const response = {
      statusCode: 200,
      body: res
    };

    console.log(response);
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
        //console.log(results[0]);
        return queryResult; /* https://developer.mozilla.org/de/docs/Web/JavaScript/Guide/Using_promises   */
        //callback(null, results[0]);
        //console.log(results);
      })
    .then(
      (results) => {
        //queryResult = results[0];
    
        console.log(JSON.parse(JSON.stringify(results)));
         res = JSON.parse(JSON.stringify(results[0]));
        
        //console.log(res);
        return results
      })
    .catch(console.log)

};
/********************************* Database Call Withut response ******************************/

async function callinsertDB (client, queryMessage) {

  var queryResult = 0;

  await client.query(queryMessage)
    
    .catch(console.log)

};

/********************************* Call API TO GET PROD ORDER NR for direct sale ******************************/
async function getProdOrd(jObj, orderNr, hasPrint,newArtNr, c) {

let parsed;
  
  var data = JSON.stringify({"body":  [{"orderNr": orderNr  ,"lineItem": jObj.body[c].lineItem,"articleNr" :newArtNr,"colorCode" :jObj.body[c].colorCode,"quantity":jObj.body[c].quantity,"materialNr":jObj.body[c].materialNr,"hasPrint":hasPrint,"motivNr":jObj.body[c].motivNr,"toStock":jObj.body[0].toStock}]});
  console.log(data)
  await axios.post('https://5club7wre8.execute-api.eu-central-1.amazonaws.com/sales/getprodonr', data)
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
/********************************* Call API TO GET PROD ORDER NR for STOCK ******************************/
async function getProdOrdToStock(jObj, hasPrint,newArtNr, c) {

let parsed;
  
  var data = JSON.stringify({"body":  [{"lineItem": jObj.body[c].lineItem,"articleNr" :newArtNr,"colorCode" :jObj.body[c].colorCode,"quantity":jObj.body[c].quantity,"materialNr":jObj.body[c].materialNr,"hasPrint":hasPrint,"motivNr":jObj.body[c].motivNr,"toStock":jObj.body[0].toStock}]});
  console.log(data)
  await axios.post('https://5club7wre8.execute-api.eu-central-1.amazonaws.com/sales/getprodonr', data)
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
const detectBusiness = function (jObj) {
  var queryMessage = "SELECT business FROM esi_sales.customer where customerID=" +  jObj.body[0].customerID + ";";
  console.log(queryMessage);
  return (queryMessage);
};

const countOrderHeaders = function () {
  var queryMessage = "SELECT COUNT(*) as counts FROM esi_sales.orderheader;";
  console.log(queryMessage)
  return (queryMessage);
};


const maxArticleNr = function () {
  var queryMessage = "SELECT max(articlenr) as max FROM esi_sales.articlenumber;";
  console.log(queryMessage)
  return (queryMessage);
};



const countOrderDetails = function () {
  var queryMessage = "SELECT max(detailsID) as detailscounts FROM esi_sales.orderdetails;"; //"SELECT COUNT(*) as detailscounts FROM esi_sales.orderdetails;"
  console.log(queryMessage)
  return (queryMessage);
};


const countExistingArtNr = function (jObj, c) {
  var queryMessage = "SELECT COUNT(*) as articleNrexists FROM esi_sales.articlenumber where materialNr=" + jObj.body[c].materialNr + " and motivNr=" + jObj.body[c].motivNr + " and colorCode='" + jObj.body[c].colorCode + "';";
  console.log(queryMessage);
  return (queryMessage);
};


const createNewArtNr = function (jObj, newArtNr, c) {
  var queryMessage = "insert into esi_sales.articlenumber (articleNr, materialNr, motivNr, colorCode) VALUES (" + newArtNr + "," + jObj.body[c].materialNr + "," +jObj.body[c].motivNr + ",'" + jObj.body[c].colorCode + "');";
  console.log(queryMessage);
  return (queryMessage);
};


const createNewOrderHeader = function (jObj, orderNr, customerID, c) {
  var queryMessage = "insert into esi_sales.orderheader (orderNr, customerID, orderDate, toStock) VALUES ('" + orderNr +"', " + jObj.body[0].customerID + ", '" + date2 + "', '" + jObj.body[0].toStock + "');";
  console.log(queryMessage);
  return (queryMessage);
};


const createOrderDetails = function (jObj,detailscounts,prodOrderNr, newArtNr, orderNr, hasPrint, c) {
  var queryMessage = "insert into esi_sales.orderdetails (detailsID, prodOrderNr , orderNr, lineItem, articleNr, colorCode,quantity,materialNr,hasPrint,motivNr,toStock) VALUES ('" + detailscounts + "','" + prodOrderNr + "','" + orderNr + "'," + jObj.body[c].lineItem + "," +  newArtNr + ",'" + jObj.body[c].colorCode + "'," + jObj.body[c].quantity + "," + jObj.body[c].materialNr + "," + hasPrint +"," + jObj.body[c].motivNr + "," + jObj.body[0].toStock + ");";
  console.log(queryMessage);
  return (queryMessage);
};

const createOrderDetailsToStock = function (jObj,detailscounts,prodOrderNr, newArtNr, hasPrint, c) {
  var queryMessage = "insert into esi_sales.orderdetails (detailsID, prodOrderNr, lineItem, articleNr, colorCode,quantity,materialNr,hasPrint,motivNr,toStock) VALUES ('" + detailscounts + "','" + prodOrderNr + "'," + jObj.body[c].lineItem + "," +  newArtNr + ",'" + jObj.body[c].colorCode + "'," + jObj.body[c].quantity + "," + jObj.body[c].materialNr + "," + hasPrint +"," + jObj.body[c].motivNr + "," + jObj.body[0].toStock + ");";
  console.log(queryMessage);
  return (queryMessage);
};

const getArtNr = function (jObj,c) {
  var queryMessage = "SELECT articleNr FROM esi_sales.articlenumber where materialNr=" + jObj.body[c].materialNr + " and motivNr=" + jObj.body[c].motivNr + " and colorCode='" + jObj.body[c].colorCode + "';";
  console.log(queryMessage);
  return (queryMessage);
};