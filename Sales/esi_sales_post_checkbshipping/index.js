/********************************* Librarys ***********************************/

const mysql = require('mysql2/promise');
var config = require('./config');



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
  
const pool = await mysql.createPool(con);
    
    let tested=true;
    let orderNr=event.orderNr;

  try {
      
    
    //GET OLD ORDERINFOS
     await callinsertDB(pool, orderTested(orderNr));

    const response = {
      statusCode: 200,
      body: tested
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



/********************************* Database Call Without response ******************************/

async function callinsertDB (client, queryMessage) {

  await client.query(queryMessage)
    .catch(console.log)
};



/********************************* Helper Function SELECT Order FROM DB***********/
const orderTested = function (orderNr) {
  var queryMessage = "UPDATE esi_sales.orderheader SET tested = true WHERE orderNr ='" + orderNr + "';" ;
  console.log(queryMessage);
  return (queryMessage);
};
