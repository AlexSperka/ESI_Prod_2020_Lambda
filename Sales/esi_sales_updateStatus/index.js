

/********************************* Librarys ***********************************/

const mysql = require('mysql2/promise');
var config = require('./config');

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

 
  let prodOrderNr= event.prodOrderNr;
  let statusID= event.statusID;
  let Statusdescription=event.statusdescription; 


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
    return { "status": "That did not work" };
  } finally {
    await pool.end()
  }

}



/********************************* Database Call Withut response ******************************/

async function callinsertDB (client, queryMessage) {

  var queryResult = 0;

  await client.query(queryMessage)
    
    .catch(console.log)

};



/********************************* Helper Function SELECT Order FROM DB***********/
const updateStatus = function (statusID, Statusdescription, prodOrderNr) {
  var queryMessage = "UPDATE esi_sales.status SET statusID = '" + statusID +  "', Statusdescription = '" + Statusdescription  + "' WHERE (`prodOrderNr` = '" + prodOrderNr + "');";
  console.log(queryMessage);
  return (queryMessage);
};
