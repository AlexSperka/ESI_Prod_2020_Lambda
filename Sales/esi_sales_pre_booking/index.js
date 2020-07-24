///////////////////////////////////// IMPORTS ///////////////////////////////////////

const mysql = require('mysql2/promise');
var config = require('./config');
var moment = require("moment-timezone");
const axios = require('axios');


///////////////////////////////////// GLOBALS ///////////////////////////////////////

var res; /** Response of the DB call */
var body = [];
var date2 = moment().format('YYYYMMDD');
var date = moment().format('YYYY-MM-DD');
var ans;

///////////////////////////////////// DATABASE CONNECTION ///////////////////////////////////////

const con = {
  host: config.host,
  user: config.user,
  password: config.password,
  port: config.port,
};

/////////////////////////////////////EXPORTS HANDLER///////////////////////////////////////

exports.handler = async (event, context, callback) => {

  console.log(event);
  const pool = await mysql.createPool(con);
  let orderNr = 0;
  orderNr = event.orderNr;
  let i;

  try {
    //check if the the booking is a toStock booking or a regular one 
    if (typeof orderNr == 'string' || orderNr instanceof String) {
      // if it is a regular one 

      //get all prodOrderNrs of a finished OrderNR
      await callDB(pool, getProdOrderNrs(orderNr));
      let allOrderNr = res;

      //prepare the JSON file for MAWI API CALL
      for (i in allOrderNr) {
        body[i] = { "productionOrderNr": allOrderNr[i].prodOrderNr };
      }

      //Call MAWI API 
      await postBooking(body);
      let getProdOrderNr = res;

      //Prepare the answer and update the status of booked prodOrderNrs
      for (i in getProdOrderNr) {
        console.log("prodorderNr die ausgelagert wird" + getProdOrderNr[i].reservation.goodsOrderPos[0].productionOrderNr);
        await callinsertDB(pool, updateStatus(getProdOrderNr, i));
      }
      ans = "Die Ordernummer: " + orderNr + " wurde erfolgreich ausgebucht.";

    }

    //if it is a toStock booking   
    else {

      // get the input data
      let articleNr = event.data[0].fkmaterials;
      let quantity = event.data[0].quantity;
      let customerID = event.data[0].customerID;

      // is the customer Business or ordinary
      await callDB(pool, detectBusiness(customerID));
      let business = res[0].business;

      //for business customers 
      if (business == true) {

        body[0] = { "fkmaterials": articleNr, "quantity": quantity };

        // get a new OrderNr per day/per business true/false
        await callDB(pool, newDaycount(date));
        let countday = res[0].countday;

        if (countday == 0) {
          if (business == 1) {
            await callDB(pool, newdaycountForBusiness());
            let counts = res[0].countday;
            counts++;
            orderNr = 'B-' + date2 + '-' + counts;
          }

          else if (business == 0) {
            await callDB(pool, newdaycountForConsumer());
            let counts = res[0].countday;
            counts++;
            orderNr = "C-" + date2 + "-" + counts;
          }
        }
        else {
          if (business == 1) {
            await callDB(pool, newdaycountForBusiness());
            let counts = res[0].countday;
            counts++;
            orderNr = 'B-' + date2 + '-' + counts;
          }

          else if (business == 0) {
            await callDB(pool, newdaycountForConsumer());
            let counts = res[0].countday;
            counts++;
            orderNr = "C-" + date2 + "-" + counts;
          }
        }

        // call the MAWI Api for booking
        await postBooking(body);
        let getProdOrderNr = res[0].reservation.goodsOrderPos;
        console.log(getProdOrderNr);

        //  process the booked entries   
        for (i in getProdOrderNr) {
          //get the max enties    
          await callDB(pool, getTheMaxQuantity(getProdOrderNr, i));
          let maxQuantity = res[0].maxQuantity;
          console.log(maxQuantity);

          //get old Infos from the prodOrderNr
          await callDB(pool, getOldProdOrderInfos(getProdOrderNr, i));
          let oldProdOrderInfos = res[0];

          //check if the booked quantity is the quantity of the prodOrderNr
          if (i == 0) {
            //if yes ... create a new OrderHeader
            await callinsertDB(pool, createNewOrderHeader(orderNr, customerID, date2, oldProdOrderInfos));
          }

          if (maxQuantity == getProdOrderNr[i].quantity) {
            //update the prodOrderNr with newOrderNr

            await callinsertDB(pool, updateProdOrderNr(getProdOrderNr, i, orderNr));

            //update status STATUS for prodOrderNr = getProdOrderNr[i].productionOrderNr

            await callinsertDB(pool, updateStatusWithOrderNr(getProdOrderNr, i, orderNr));
          }
          else if (maxQuantity >= getProdOrderNr[i].quantity)
          //if the booked quantity is smaller than the quantity of a ProdOrderNr, update the quantitiy of the remaining prodOrderNr and create a new one that will be booked
          {
            console.log("von der Mawi erhaltene, ausgebuchte Quantitiy: " + getProdOrderNr[i].quantity);

            // get new ProdOrderNr appendix 
            await callDB(pool, getNumbOfSubentrys(getProdOrderNr, i));
            let newEntryNumber = res[0].newEntryNumber;

            newEntryNumber++;
            console.log("newENTRYNR: " + newEntryNumber);

            // GEt new prodOrderNr quantity 
            let newQuantity = getProdOrderNr[i].quantity;
            console.log("qnatitiy of the NEW ProdOrderNr: " + newQuantity);
            let newPordOrderNr = getProdOrderNr[i].productionOrderNr + "-" + newEntryNumber;
            console.log(newPordOrderNr);

            //GET THE NEW PRODDETAILS ID 
            await callDB(pool, getNewDetailsID());
            let newDetailsID = res[0].newDetailsID;
            newDetailsID++;

            //INSERT NEW PRODNR AND NEW STATUS
            await callinsertDB(pool, insertNewProdOrderNr(oldProdOrderInfos, newQuantity, newPordOrderNr, newDetailsID, orderNr));
            await callinsertDB(pool, createStatus(newPordOrderNr, orderNr));

            //Update the old prodorderNr Quantity
            let newQuantityOldOProdOrderNr = Number(maxQuantity) - Number(getProdOrderNr[i].quantity);
            console.log("quatitiy of the OLD ProdOrderNr: " + newQuantityOldOProdOrderNr);

            await callinsertDB(pool, updateOldProdOrderNr(getProdOrderNr, i, newQuantityOldOProdOrderNr));

          }
        }
        ans = "Für die Kundennummer " + customerID + " wurde die Ordernummer " + orderNr + " erfolgreich erstellt und entsprechende Produktionsordernummern ausgebucht.";
      }
      else { ans = "Die angegebene Kundennummer ist kein Businesskunde und kann deshalb nicht nach Artikelnummer ausbuchen." }
    }

    const response = {
      statusCode: 200,
      ans
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
        console.log(JSON.parse(JSON.stringify(results)));
        res = JSON.parse(JSON.stringify(results));
        //console.log(JSON.parse(JSON.stringify(results[0])));
        return results;
      })
    .catch(console.log);
}

/////////////////////////////////////Call DB without response ///////////////////////////////////////

async function callinsertDB(client, queryMessage) {

  await client.query(queryMessage)
    .catch(console.log);
  console.log("interted");
}

/////////////////////////////////////Call API to place booking ///////////////////////////////////////

async function postBooking(body) {

  let parsed;

  await axios.post('https://423rw0hwdj.execute-api.eu-central-1.amazonaws.com/Prod/goods/orders', body)
    .then((results) => {

      parsed = JSON.stringify(results.data);
      console.log(parsed);
      res = JSON.parse(parsed);
      res = res.body;
      console.log(res);
      return results;
    })
    .catch((error) => {
      console.error(error)
    })
}


/////////////////////////////////////SQL Querys ///////////////////////////////////////


const getProdOrderNrs = function (orderNr) {
  var queryMessage = "SELECT prodOrderNr FROM esi_sales.orderdetails where orderNr='" + orderNr + "';";
  //console.log(queryMessage);
  return (queryMessage);
};

const getTheMaxQuantity = function (getProdOrderNr, i) {
  var queryMessage = "SELECT quantity as maxQuantity FROM esi_sales.orderdetails where prodOrderNr='" + getProdOrderNr[i].productionOrderNr + "';";
  console.log(queryMessage);
  return (queryMessage);
};

const getNumbOfSubentrys = function (getProdOrderNr, i) {
  var queryMessage = "SELECT count(*) as newEntryNumber FROM esi_sales.orderdetails where prodOrderNr like '%" + getProdOrderNr[i].productionOrderNr + "%';";
  console.log(queryMessage);
  return (queryMessage);
};

const getOldProdOrderInfos = function (getProdOrderNr, i) {
  var queryMessage = "SELECT * FROM esi_sales.orderdetails where prodOrderNr like '" + getProdOrderNr[i].productionOrderNr + "';";
  console.log(queryMessage);
  return (queryMessage);
};

const getNewDetailsID = function () {
  var queryMessage = "SELECT max(detailsID) as newDetailsID FROM esi_sales.orderdetails;";
  console.log(queryMessage);
  return (queryMessage);
};

const insertNewProdOrderNr = function (oldProdOrderInfos, newQuantity, newPordOrderNr, newDetailsID, orderNr) {
  var queryMessage = " insert into esi_sales.orderdetails (detailsID, prodOrderNr , orderNr, lineItem, articleNr, colorCode,quantity,price,materialNr,hasPrint,motivNr,toStock) VALUES (" + newDetailsID + ",'" + newPordOrderNr + "', '" + orderNr + "', 1," + oldProdOrderInfos.articleNr + ", '" + oldProdOrderInfos.colorCode + "'," + newQuantity + "," + oldProdOrderInfos.price + "," + oldProdOrderInfos.materialNr + "," + oldProdOrderInfos.hasPrint + "," + oldProdOrderInfos.motivNr + "," + oldProdOrderInfos.toStock + ");";
  console.log(queryMessage);
  return (queryMessage);
};

const updateOldProdOrderNr = function (getProdOrderNr, i, newQuantityOldOProdOrderNr) {
  var queryMessage = "UPDATE esi_sales.orderdetails SET quantity = " + newQuantityOldOProdOrderNr + " WHERE (prodOrderNr = '" + getProdOrderNr[i].productionOrderNr + "'); ";
  console.log(queryMessage);
  return (queryMessage);
};

const updateStatus = function (getProdOrderNr, i) {
  var queryMessage = "UPDATE esi_sales.status SET statusID =5, Statusdescription = 'Ware ausgelagert' WHERE (`prodOrderNr` = '" + getProdOrderNr[i].reservation.goodsOrderPos[0].productionOrderNr + "');";
  console.log(queryMessage);
  return (queryMessage);
};

const updateStatusWithOrderNr = function (getProdOrderNr, i, orderNr) {
  var queryMessage = "UPDATE esi_sales.status SET statusID =5, Statusdescription = 'Ware ausgelagert', orderNr='" + orderNr + "' WHERE (`prodOrderNr` = '" + getProdOrderNr[i].productionOrderNr + "');";
  console.log(queryMessage);
  return (queryMessage);
};

const newDaycount = function (date) {
  var queryMessage = "SELECT count(*) as countday FROM esi_sales.orderheader where orderNr like '%" + date2 + "%'";
  console.log(queryMessage);
  return (queryMessage);
};

const detectBusiness = function (customerID) {
  var queryMessage = "SELECT business FROM esi_sales.customer where customerID=" + customerID + ";";
  console.log(queryMessage);
  return (queryMessage);
};

const newdaycountForConsumer = function (date) {
  var queryMessage = "SELECT count(*) as countday FROM esi_sales.orderheader where orderNr like 'C-%" + date2 + "%'";
  console.log(queryMessage);
  return (queryMessage);
};
const newdaycountForBusiness = function (date) {
  var queryMessage = "SELECT count(*) as countday FROM esi_sales.orderheader where orderNr like 'B-%" + date2 + "%'";
  console.log(queryMessage);
  return (queryMessage);
};
const createNewOrderHeader = function (orderNr, customerID, date, oldProdOrderInfos) {
  var queryMessage = "insert into esi_sales.orderheader (orderNr, customerID, orderDate, toStock) VALUES ('" + orderNr + "', " + customerID + ", '" + date + "', '" + oldProdOrderInfos.toStock + "');";
  console.log(queryMessage);
  return (queryMessage);
};

const updateProdOrderNr = function (getProdOrderNr, i, orderNr) {
  var queryMessage = "UPDATE esi_sales.orderdetails SET orderNr = '" + orderNr + "' WHERE (prodOrderNr = '" + getProdOrderNr[i].productionOrderNr + "'); ";
  console.log(queryMessage);
  return (queryMessage);
};

const createStatus = function (newPordOrderNr, orderNr) {
  var queryMessage = "insert into esi_sales.status (prodOrderNr , orderNr, statusID, Statusdescription) VALUES ('" + newPordOrderNr + "', '" + orderNr + "', 5, 'Ware ausgelagert');";
  console.log(queryMessage);
  return (queryMessage);
};