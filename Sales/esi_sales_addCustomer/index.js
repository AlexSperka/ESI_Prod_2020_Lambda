/********************************* Librarys ***********************************/

const mysql = require('mysql2/promise');
var config = require('./config');


/********************************* Variables **********************************/
var res; /** Response of the DB call */
var results=[];
var message;
/********************************* SQL Connection *****************************/

const con = {
    host: config.host,
    user: config.user,
    password: config.password,
    port: config.port,
};


/********************************* Export Handler *****************************/
exports.handler = async (event, context, callback) => {
  


const pool = await mysql.createPool(con)


let firstName= event.firstName;
let surName= event.surName;
let company=event.company; 
let street=event.street; 
let PostCode=event.PostCode; 
let city=event.city; 
let country=event.country; 
let phone=event.phone; 
let mail=event.mail; 
let business=event.business; 
let newcustomerID;

  try {
    
    if(business==0)
    {
        await callDB(pool, countOrdinaryCustomers(firstName, surName, street, PostCode, city, country, phone, mail, business));
        let count= res.count;
         console.log("ount " + count)
        if(count>=1)
        {
             await callDB(pool, checkIfOrdinaryCustomerExists(firstName, surName, street, PostCode, city, country, phone, mail, business));
              newcustomerID= res.customerID;
              message='Die/Der Kund/inn/e '+ firstName+ ' ' + surName + ' exisitert bereits und hat die Kundennummer: ' + newcustomerID + '.'
        }
        else
        {
             await callDB(pool, getNewCustomerID());
             newcustomerID= res.newcustomerID;
             console.log(newcustomerID)
             newcustomerID++;
             
             await callinsertDB(pool, insertOrdinaryCustomer(newcustomerID , firstName, surName, street, PostCode, city, country, phone, mail, business));
             message='Die/Der Kund/inn/e '+ firstName+ ' ' + surName + ' hat die Kundennummer: ' + newcustomerID + '.'

        }
    }
    else {
        
        await callDB(pool, countBusinessCustomers(firstName, surName, company, street, PostCode, city, country, phone, mail, business));
        let count= res.count;
        console.log("ount " + count)
        
       if(count>=1)
        {
            
            await callDB(pool, checkIfBusinessCustomerExists(firstName, surName, company, street, PostCode, city, country, phone, mail, business));
              newcustomerID= res.customerID;
              console.log("res: " + res)
              message='Die/Der Geschäftskund/inn '+ firstName+ ' ' + surName + ' des Unternehmens ' + company +' exisitert bereits und hat die Kundennummer: ' + newcustomerID + '.'
        }
        else
        {
            
             await callDB(pool, getNewCustomerID());
             newcustomerID= res.newcustomerID;
             console.log(newcustomerID)
             newcustomerID++;
             
             console.log(newcustomerID , firstName, surName, company, street, PostCode, city, country, phone, mail, business)
             await callinsertDB(pool, insertBusinessCustomer(newcustomerID , firstName, surName, company, street, PostCode, city, country, phone, mail, business));
             message= 'Die/Der Geschäftskund/inn '+ firstName+ ' ' + surName + ' des Unternehmens ' + company +' hat die Kundennummer: ' + newcustomerID + '.'
        }
   
    }
        
    
    const response = {
    
      statusCode: 200,
      message: message

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
        //queryResult = results[0];
         console.log(JSON.parse(JSON.stringify(results)));
         res = JSON.parse(JSON.stringify(results[0]));
        
        return results
      })
    .catch(console.log)

};

/********************************* Database Call Withut response ******************************/

async function callinsertDB (client, queryMessage) {


  await client.query(queryMessage)
    
    .catch(console.log)

};


/********************************* Helper Function SELECT Order FROM DB***********/


const insertBusinessCustomer = function (newcustomerID , firstName, surName, company, street, PostCode, city, country, phone, mail, business) {
  var queryMessage = "insert into esi_sales.customer (customerID , firstName, surName, company, street, PostCode, city, country, phone, mail, business) VALUES (" + newcustomerID +", '" + firstName + "', '" + surName + "', '" + company + "', '" + street + "', " + PostCode + ", '" + city + "', '" + country + "', '" + phone + "', '" + mail + "', " + business + ");";
  console.log(queryMessage)
  return (queryMessage);
};


const insertOrdinaryCustomer = function (newcustomerID , firstName, surName, street, PostCode, city, country, phone, mail, business) {
  var queryMessage = "insert into esi_sales.customer (customerID , firstName, surName, street, PostCode, city, country, phone, mail, business) VALUES (" + newcustomerID +", '" + firstName + "', '" + surName + "', '" + street + "', " + PostCode + ", '" + city + "', '" + country + "', '" + phone + "', '" + mail + "', " + business + ");";
  console.log(queryMessage)
  return (queryMessage);
};


const getNewCustomerID = function () {
  var queryMessage = "SELECT max(customerID) as newcustomerID FROM esi_sales.customer;";
  console.log(queryMessage)
  return (queryMessage);
};

const checkIfOrdinaryCustomerExists = function (firstName, surName, street, PostCode, city, country, phone, mail, business) {
  var queryMessage = "Select * from esi_sales.customer where firstName='" + firstName + "' and surName='" + surName + "' and street='" +  street + "' and PostCode=" +  PostCode + " and city='" +  city + "' and country='" +  country + "' and phone='" +  phone + "' and mail='" +  mail + "' and business=" +  business + ";";
  console.log(queryMessage)
  return (queryMessage);
};

const checkIfBusinessCustomerExists = function (firstName, surName, company, street, PostCode, city, country, phone, mail, business) {
  var queryMessage = "Select * from esi_sales.customer where firstName='" + firstName + "' and surName='" + surName + "' and company='" +  company + "' and street='" +  street + "' and PostCode=" +  PostCode + " and city='" +  city + "' and country='" +  country + "'and phone='" +  phone + "' and mail='" +  mail + "' and business=" +  business + ";";
    console.log(queryMessage)
  return (queryMessage);
};

const countBusinessCustomers = function (firstName, surName, company, street, PostCode, city, country, phone, mail, business) {
  console.log(firstName, surName, company, street, PostCode, city, country, phone, mail, business)
  var queryMessage = "SELECT COUNT(*) as count from esi_sales.customer where firstName='" + firstName + "' and surName='" + surName + "' and company='" +  company + "' and street='" +  street + "' and PostCode=" +  PostCode + " and city='" +  city + "' and country='" +  country + "'and phone='" +  phone + "' and mail='" +  mail + "' and business=" +  business + ";";
  return (queryMessage);
};

const countOrdinaryCustomers = function (firstName, surName, street, PostCode, city, country, phone, mail, business) {
   console.log(firstName, surName, street, PostCode, city, country, phone, mail, business)
  var queryMessage = "SELECT COUNT(*) as count from esi_sales.customer where firstName='" + firstName + "' and surName='" + surName + "' and street='" +  street + "' and PostCode=" +  PostCode + " and city='" +  city + "' and country='" +  country + "' and phone='" +  phone + "' and mail='" +  mail + "' and business=" +  business + ";";
  console.log(queryMessage)
  return (queryMessage);
};