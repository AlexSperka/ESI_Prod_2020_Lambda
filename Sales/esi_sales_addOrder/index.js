///////////////////////////////////// IMPORTS ///////////////////////////////////////

const mysql = require('mysql2/promise');
var config = require('./config');
var moment = require("moment-timezone");
const axios = require('axios');

///////////////////////////////////// GLOBALS ///////////////////////////////////////

var res = '';
var date = moment().format('YYYY-MM-DD');
var date2 = moment().format('YYYYMMDD');
let prodOrderNr;
let orderNr;
let j; let c;
let hasPrint;
let getOrderNr;

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

  var answer = [];
  console.log(event);

  let jObj = JSON.stringify(event);
  jObj = JSON.parse(jObj);

  try {

    //get nessary primary information
    await callDB(pool, countOrderDetails());
    let detailscounts = res.detailscounts;

    await callDB(pool, newDaycount(date));
    let countday = res.countday;
    console.log(countday)

    await callDB(pool, detectBusiness(jObj));
    let business = res.business;

    //create a new OrderNr per day/ per business/ordinary customer
    if (countday == 0) {
      if (business == 1) {
        await callDB(pool, newdaycountForBusiness());
        let counts = res.countday;
        counts++;
        orderNr = 'B-' + date2 + '-' + counts;
        console.log("BusinessCounts: " + counts);
      }

      else if (business == 0) {
        await callDB(pool, newdaycountForConsumer());
        let counts = res.countday;
        counts++;
        orderNr = "C-" + date2 + "-" + counts;
        console.log("ConsumerCounts: " + counts);
      }
    }
    else {
      if (business == 1) {
        await callDB(pool, newdaycountForBusiness());
        let counts = res.countday;
        counts++;
        orderNr = 'B-' + date2 + '-' + counts;
        console.log("BusinessCounts: " + counts);
      }
      else if (business == 0) {
        await callDB(pool, newdaycountForConsumer());
        let counts = res.countday;
        counts++;
        orderNr = "C-" + date2 + "-" + counts;
        console.log("ConsumerCounts: " + counts);
      }
    }
    console.log(orderNr);

    // for every entry in the order
    for (j in jObj.body) {
      c = j;
      if (jObj.body[c].motivNr == null) { hasPrint = false }
      else { hasPrint = true }

      //Check if the ArtNr already exists
      await callDB(pool, countExistingArtNr(jObj, c));
      let articleNrexists = res.articleNrexists;
      await callDB(pool, maxArticleNr());
      let newArtNr = res.max;

      // check if order isn't "toStock"
      if (jObj.body[0].toStock == false) {
        //console.log( articleNrexists, business)

        //Check if order belongs to business customer
        await callDB(pool, detectBusiness(jObj));
        let business = res.business;
        console.log("articleNrexists= " + articleNrexists, "business= " + business);

        //if articleNr doesn't exist and order for business customer
        if (articleNrexists == 0 && business == 1) {
          //create new articleNr
          newArtNr++;
          console.log("newArtNr= " + newArtNr);
          await callinsertDB(pool, createNewArtNr(jObj, newArtNr, c));
          console.log("newArtNr after insert= " + newArtNr);

          //create the order in the system
          if (c == 0) {
            console.log("C= " + c);
            detailscounts++;
            console.log(detailscounts);

            // create orderheader entry   
            await callinsertDB(pool, createNewOrderHeader(jObj, orderNr, c));
            //console.log("orderNr after insert= " +orderNr);

            // get a new prodOrderNr
            await getProdOrd(jObj, orderNr, hasPrint, newArtNr, c);
            let prodOrderNr = res;
            prodOrderNr = prodOrderNr.prodOrderNum;
            console.log(prodOrderNr);

            // create orderddetails entry 
            await callinsertDB(pool, createOrderDetails(jObj, detailscounts, prodOrderNr, newArtNr, orderNr, hasPrint, c));

            // create Status entry
            await callinsertDB(pool, createStatus(prodOrderNr, orderNr));

            answer[0] = "Auftrag wurde erfolgreich erstellt. Die Ordernummer lautet: '" + orderNr + ":";
            getOrderNr = orderNr;
          }
          else if (c > 0) {
            //console.log("articleNrexists= "+articleNrexists );
            console.log(detailscounts)
            detailscounts++;
            console.log(detailscounts)

            // get a new prodOrderNr
            await getProdOrd(jObj, orderNr, hasPrint, newArtNr, c);
            let prodOrderNr = res;
            prodOrderNr = prodOrderNr.prodOrderNum;
            console.log(prodOrderNr);

            // create orderdetails entry 
            await callinsertDB(pool, createOrderDetails(jObj, detailscounts, prodOrderNr, newArtNr, orderNr, hasPrint, c));

            // create Status entry
            await callinsertDB(pool, createStatus(prodOrderNr, orderNr));
            getOrderNr = orderNr;
          }
        }
        else if (articleNrexists == 0 && business == 0) //if articleNr doesn't exist and order for ordinary customer
        {
          newArtNr = 10000001;

          if (c == 0) {
            console.log("C= " + c);

            detailscounts++;
            console.log(detailscounts)

            // create orderheader entry  
            await callinsertDB(pool, createNewOrderHeader(jObj, orderNr, c));

            // get a new prodOrderNr
            await getProdOrd(jObj, orderNr, hasPrint, newArtNr, c);
            let prodOrderNr = res;
            prodOrderNr = prodOrderNr.prodOrderNum;
            console.log(prodOrderNr);

            // create orderdetails entry 
            await callinsertDB(pool, createOrderDetails(jObj, detailscounts, prodOrderNr, newArtNr, orderNr, hasPrint, c));

            // create Status entry
            await callinsertDB(pool, createStatus(prodOrderNr, orderNr));
            answer[0] = "Auftrag wurde erfolgreich erstellt. Die Ordernummer lautet: '" + orderNr + ":"; getOrderNr = orderNr;
          }
          else if (c > 0) {
            //console.log("articleNrexists= "+articleNrexists );
            console.log(detailscounts);
            detailscounts++;
            console.log(detailscounts);

            // get a new prodOrderNr
            await getProdOrd(jObj, orderNr, hasPrint, newArtNr, c);
            let prodOrderNr = res;
            prodOrderNr = prodOrderNr.prodOrderNum;
            console.log(prodOrderNr);

            // create orderdetails entry
            await callinsertDB(pool, createOrderDetails(jObj, detailscounts, prodOrderNr, newArtNr, orderNr, hasPrint, c));

            // create Status entry
            await callinsertDB(pool, createStatus(prodOrderNr, orderNr));
          }
        }
        else if (articleNrexists == 1 && business == 1)  //if articleNr exists and order for business customer
        {
          //get the articleNr
          await callDB(pool, getArtNr(jObj, c));
          newArtNr = res;
          newArtNr = newArtNr.articleNr;

          if (c == 0) {
            console.log("C= " + c);
            detailscounts++;
            console.log(detailscounts);

            // create orderheader entry     
            await callinsertDB(pool, createNewOrderHeader(jObj, orderNr, c));

            // get a new prodOrderNr
            await getProdOrd(jObj, orderNr, hasPrint, newArtNr, c);
            let prodOrderNr = res;
            prodOrderNr = prodOrderNr.prodOrderNum;
            console.log(prodOrderNr);

            // create orderdetails entry
            await callinsertDB(pool, createOrderDetails(jObj, detailscounts, prodOrderNr, newArtNr, orderNr, hasPrint, c));

            // create Status entry
            await callinsertDB(pool, createStatus(prodOrderNr, orderNr));
          }
          else if (c > 0) {
            detailscounts++;
            console.log(detailscounts);

            // get a new prodOrderNr
            await getProdOrd(jObj, orderNr, hasPrint, newArtNr, c);
            let prodOrderNr = res;
            prodOrderNr = prodOrderNr.prodOrderNum;
            console.log(prodOrderNr);

            // create orderdetails entry
            await callinsertDB(pool, createOrderDetails(jObj, detailscounts, prodOrderNr, newArtNr, orderNr, hasPrint, c));

            // create Status entry
            await callinsertDB(pool, createStatus(prodOrderNr, orderNr));
            answer[0] = "Auftrag wurde erfolgreich erstellt. Die Ordernummer lautet: '" + orderNr + ":"; getOrderNr = orderNr;
          }
        }
        else if (articleNrexists == 1 && business == 0)  //if articleNr exists and order for ordinary customer
        {

          newArtNr = 10000001;

          if (c == 0) {
            console.log("C= " + c);

            detailscounts++;
            console.log("detailscounts nach addition c=0= " + detailscounts);

            // create orderheader entry   
            await callinsertDB(pool, createNewOrderHeader(jObj, orderNr, c));

            // get a new prodOrderNr
            await getProdOrd(jObj, orderNr, hasPrint, newArtNr, c);
            let prodOrderNr = res;
            prodOrderNr = prodOrderNr.prodOrderNum;
            console.log(prodOrderNr);

            // create orderdetails entry
            await callinsertDB(pool, createOrderDetails(jObj, detailscounts, prodOrderNr, newArtNr, orderNr, hasPrint, c));

            // create Status entry
            await callinsertDB(pool, createStatus(prodOrderNr, orderNr));
            answer[0] = "Auftrag wurde erfolgreich erstellt. Die Ordernummer lautet: '" + orderNr + ":"; getOrderNr = orderNr;
          }
          else if (c > 0) { //console.log("articleNrexists= "+articleNrexists );
            detailscounts++;
            console.log("detailscounts nach addition c>0= " + detailscounts);

            // get a new prodOrderNr
            await getProdOrd(jObj, orderNr, hasPrint, newArtNr, c);
            let prodOrderNr = res;
            prodOrderNr = prodOrderNr.prodOrderNum;
            console.log(prodOrderNr);

            // create orderdetails entry
            await callinsertDB(pool, createOrderDetails(jObj, detailscounts, prodOrderNr, newArtNr, orderNr, hasPrint, c));

            // create Status entry
            await callinsertDB(pool, createStatus(prodOrderNr, orderNr));
          }

        }
      }

      else // if order is toStock
      {
        //if articleNr doesn't exist
        if (articleNrexists == 0) {

          //create new articleNr articleNr 
          newArtNr++;
          console.log("newArtNr= " + newArtNr);

          await callinsertDB(pool, createNewArtNr(jObj, newArtNr, c));
          console.log("newArtNr after insert= " + newArtNr);

          if (c == 0) {
            console.log("C= " + c);
            detailscounts++;
            console.log(detailscounts)

            // get a new prodOrderNr
            orderNr = null;
            await getProdOrd(jObj, orderNr, hasPrint, newArtNr, c);
            let prodOrderNr = res;
            prodOrderNr = prodOrderNr.prodOrderNum;
            console.log(prodOrderNr);

            // create orderdetails entry
            await callinsertDB(pool, createOrderDetailsToStock(jObj, detailscounts, prodOrderNr, newArtNr, hasPrint, c));

            // create Status entry
            orderNr = null;
            await callinsertDB(pool, createStatus(prodOrderNr, orderNr));
            answer[c] = "Dies War eine ToStock-Order. Die Artikelnummer von Warenposition: " + jObj.body[c].lineItem + " lautet: " + newArtNr + "."
          }
          else if (c > 0) {

            console.log(detailscounts)
            detailscounts++;
            console.log(detailscounts)

            // get a new prodOrderNr
            orderNr = null;
            await getProdOrd(jObj, orderNr, hasPrint, newArtNr, c);
            let prodOrderNr = res;
            prodOrderNr = prodOrderNr.prodOrderNum;
            console.log(prodOrderNr);

            // create orderdetails entry
            await callinsertDB(pool, createOrderDetailsToStock(jObj, detailscounts, prodOrderNr, newArtNr, hasPrint, c));

            // create Status entry
            orderNr = null;
            await callinsertDB(pool, createStatus(prodOrderNr, orderNr));
            answer[c] = "Dies War eine ToStock-Order. Die Artikelnummer von Warenposition: " + jObj.body[c].lineItem + " lautet: " + newArtNr + "."
          }


        }

        else {
          await callDB(pool, getArtNr(jObj, c));
          newArtNr = res; // EVTL PROBLEM
          newArtNr = newArtNr.articleNr;

          if (c == 0) {
            console.log("C= " + c);
            detailscounts++;
            console.log(detailscounts)

            // get a new prodOrderNr
            orderNr = null;
            await getProdOrd(jObj, orderNr, hasPrint, newArtNr, c);
            let prodOrderNr = res;
            prodOrderNr = prodOrderNr.prodOrderNum;
            console.log(prodOrderNr);

            // create orderdetails entry
            await callinsertDB(pool, createOrderDetailsToStock(jObj, detailscounts, prodOrderNr, newArtNr, hasPrint, c));

            // create Status entry
            orderNr = null;
            await callinsertDB(pool, createStatus(prodOrderNr, orderNr));
            answer[c] = "Dies War eine ToStock-Order. Die Artikelnummer von Warenposition: " + jObj.body[c].lineItem + " lautet: " + newArtNr + "."

          }
          else if (c > 0) {

            console.log(detailscounts)
            detailscounts++;
            console.log(detailscounts)

            // get a new prodOrderNr
            orderNr = null;
            await getProdOrd(jObj, orderNr, hasPrint, newArtNr, c);
            let prodOrderNr = res;
            prodOrderNr = prodOrderNr.prodOrderNum;
            console.log(prodOrderNr);

            // create orderdetails entry
            await callinsertDB(pool, createOrderDetailsToStock(jObj, detailscounts, prodOrderNr, newArtNr, hasPrint, c));

            // create Status entry
            orderNr = null;
            await callinsertDB(pool, createStatus(prodOrderNr, orderNr));
            answer[c] = "Dies War eine ToStock-Order. Die Artikelnummer von Warenposition: " + jObj.body[c].lineItem + " lautet: " + newArtNr + "."
          }
        }
      }
    }



    const response = {
      statusCode: 200,
      body: {
        message: answer,
        orderNr: getOrderNr
      }
    };

    console.log(response);
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
        console.log(JSON.parse(JSON.stringify(results[0])));
        res = JSON.parse(JSON.stringify(results[0]));
        return results;
      })
    .catch(console.log);
}

/////////////////////////////////////Call DB without response ///////////////////////////////////////

async function callinsertDB(client, queryMessage) {
  await client.query(queryMessage)
    .catch(console.log);
}

/////////////////////////////////////Call the "Produktion" API to pass the production information and parse the response ///////////////////////////////////////

async function getProdOrd(jObj, orderNr, hasPrint, newArtNr, c) {

  let parsed;

  var data = JSON.stringify({ "body": { "orderNumber": orderNr, "lineItem": jObj.body[c].lineItem, "articleNumber": newArtNr, "color": jObj.body[c].colorCode, "colorName": null, "quantity": jObj.body[c].quantity, "hasPrint": hasPrint, "motiveNumber": jObj.body[c].motivNr } });
  console.log(data);
  await axios.post('https://2pkivl4tnh.execute-api.eu-central-1.amazonaws.com/prod/createOrders', data)
    .then((results) => {

      parsed = JSON.stringify(results.data);
      console.log(parsed);
      res = JSON.parse(parsed);
      res = res.body;
      console.log(res);
      return results;
    })
    .catch((error) => {
      console.error(error);
    });
}

/////////////////////////////////////SQL Querys ///////////////////////////////////////

const detectBusiness = function (jObj) {
  var queryMessage = "SELECT business FROM esi_sales.customer where customerID=" + jObj.body[0].customerID + ";";
  console.log(queryMessage);
  return (queryMessage);
};

const maxArticleNr = function () {
  var queryMessage = "SELECT max(articlenr) as max FROM esi_sales.articlenumber;";
  console.log(queryMessage);
  return (queryMessage);
};

const countOrderDetails = function () {
  var queryMessage = "SELECT max(detailsID) as detailscounts FROM esi_sales.orderdetails;"; //"SELECT COUNT(*) as detailscounts FROM esi_sales.orderdetails;"
  console.log(queryMessage);
  return (queryMessage);
};

const countExistingArtNr = function (jObj, c) {
  var queryMessage = "SELECT COUNT(*) as articleNrexists FROM esi_sales.articlenumber where materialNr=" + jObj.body[c].materialNr + " and motivNr=" + jObj.body[c].motivNr + " and colorCode='" + jObj.body[c].colorCode + "';";
  console.log(queryMessage);
  return (queryMessage);
};

const createNewArtNr = function (jObj, newArtNr, c) {
  var queryMessage = "insert into esi_sales.articlenumber (articleNr, materialNr, motivNr, colorCode) VALUES (" + newArtNr + "," + jObj.body[c].materialNr + "," + jObj.body[c].motivNr + ",'" + jObj.body[c].colorCode + "');";
  console.log(queryMessage);
  return (queryMessage);
};

const createNewOrderHeader = function (jObj, orderNr, customerID, c) {
  var queryMessage = "insert into esi_sales.orderheader (orderNr, customerID, orderDate, toStock) VALUES ('" + orderNr + "', " + jObj.body[0].customerID + ", '" + date2 + "', '" + jObj.body[0].toStock + "');";
  console.log(queryMessage);
  return (queryMessage);
};

const createOrderDetails = function (jObj, detailscounts, prodOrderNr, newArtNr, orderNr, hasPrint, c) {
  var queryMessage = "insert into esi_sales.orderdetails (detailsID, prodOrderNr , orderNr, lineItem, articleNr, colorCode,quantity,materialNr,hasPrint,motivNr,toStock) VALUES ('" + detailscounts + "','" + prodOrderNr + "','" + orderNr + "'," + jObj.body[c].lineItem + "," + newArtNr + ",'" + jObj.body[c].colorCode + "'," + jObj.body[c].quantity + "," + jObj.body[c].materialNr + "," + hasPrint + "," + jObj.body[c].motivNr + "," + jObj.body[0].toStock + ");";
  console.log(queryMessage);
  return (queryMessage);
};

const createOrderDetailsToStock = function (jObj, detailscounts, prodOrderNr, newArtNr, hasPrint, c) {
  var queryMessage = "insert into esi_sales.orderdetails (detailsID, prodOrderNr, lineItem, articleNr, colorCode,quantity,materialNr,hasPrint,motivNr,toStock) VALUES ('" + detailscounts + "','" + prodOrderNr + "'," + jObj.body[c].lineItem + "," + newArtNr + ",'" + jObj.body[c].colorCode + "'," + jObj.body[c].quantity + "," + jObj.body[c].materialNr + "," + hasPrint + "," + jObj.body[c].motivNr + "," + jObj.body[0].toStock + ");";
  console.log(queryMessage);
  return (queryMessage);
};

const getArtNr = function (jObj, c) {
  var queryMessage = "SELECT articleNr FROM esi_sales.articlenumber where materialNr=" + jObj.body[c].materialNr + " and motivNr=" + jObj.body[c].motivNr + " and colorCode='" + jObj.body[c].colorCode + "';";
  console.log(queryMessage);
  return (queryMessage);
};

const createStatus = function (prodOrderNr, orderNr) {
  if (orderNr == 0) {
    var queryMessage = "insert into esi_sales.status (prodOrderNr , statusID, Statusdescription)VALUES ('" + prodOrderNr + "', 1, 'Bestellung eingegangen');"
  }
  else {
    var queryMessage = "insert into esi_sales.status (prodOrderNr , orderNr, statusID, Statusdescription)VALUES ('" + prodOrderNr + "', '" + orderNr + "', 1, 'Bestellung eingegangen');"
  }

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

const newDaycount = function (date) {
  var queryMessage = "SELECT count(*) as countday FROM esi_sales.orderheader where orderNr like '%" + date2 + "%'";
  console.log(queryMessage);
  return (queryMessage);
};
