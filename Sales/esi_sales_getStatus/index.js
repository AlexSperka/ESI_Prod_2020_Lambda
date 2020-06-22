/********************************* Librarys ***********************************/

const mysql = require('mysql2/promise');
var config = require('./config');

/********************************* Variables **********************************/
var res; /** Response of the DB call */
var results=[];

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

let orderNr=event.orderNr;

  try {
    
    //GET OLD ORDERINFOS
     await callDB(pool, getStatus(statusID));
        results=res;
      console.log(results)
    //console.log(orderdetailsRetour)

    const response = {
    
      statusCode: 200,
      body: results

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
        return queryResult; 

      })
    .then(
      (results) => {
        
    
        //console.log(JSON.parse(JSON.stringify(results)));
         res = JSON.parse(JSON.stringify(results));
        
        //console.log(res);
        return results
      })
    .catch(console.log)

};

/********************************* Helper Function SELECT Order FROM DB***********/

const getStatus = function (statusID) {
  var queryMessage = 'SELECT * from esi_sales.status where statusID =' +  statusID ;
  //console.log(queryMessage)
  return (queryMessage);
};


