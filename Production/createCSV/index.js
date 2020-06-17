/**
 * Function gets called by Frontend and updates the production status in prod DB as well as sales status in sales DB 
 * @author Alex Sp
 * @date 2020-06-17
 * @alias    esi_prod_createCSV
 * @memberof ProductionTeamESI
 *
 * is called by SortOrders
 * 
 * @param object json array with the orders
 * {
    "prodOrderNum": "1"
   }
 *
 * @return {String} Return URL where CSV file with next orders can be downloaded
 */

/********************************* Librarys ***********************************/
var AWS = require('aws-sdk');
var moment = require("moment-timezone");
// const json2csvParser = require('json2csv');
const { parse } = require('json2csv');

/********************************* Variables **********************************/
// get reference to S3 client
const s3 = new AWS.S3();

var output = 'Default';
var myBody = Buffer.from(output);

var dstBucket = 'esi-prod-bucket';
var dstBucketQualityValues = 'esi-prod-bucket-qualityvalues';

var qualityCSV = 'orders-';
var dstKey = 'Default.csv';

/******************************************************************************/
/********************************* Export Handler *****************************/
exports.handler = async (event, context, callback) => {

    console.log(event);
    // var date = moment();
    var time = moment().format('_HH-mm-ss');  //get UTC Time
    var date = moment().format('YYYY.MM.DD');
    console.log("date & time UTC: " + time + " and " + date);

    try {
        let dataCSV = JSON.stringify(event);
        dataCSV = JSON.parse(dataCSV);

        const fields = ['prodOrderNum','orderNumber','endDate','lineItem','articleNumber','colorHEX','colorCyan','colorMagenta','colorYellow','colorKey','quantity','hasPrint','motiveNumber'];
        const opts = {fields};
        const csv = parse(dataCSV, opts);
//        const csv = parse(dataCSV.results, opts);

        dstKey = qualityCSV+date+time+'.csv';

        const destparams = {
            Bucket: dstBucket,
            Key: dstKey,
            // Body: myBody,
            Body: Buffer.from(csv),
        };

        const putResult = await s3.putObject(destparams).promise(); /** Save CSV to Bucket */

    } catch (error) {
        console.log('Error thrown: ' + error);
        return error;
    }

    const response = {
        statusCode: 200,
        body: JSON.stringify({
            data: 'Die Parameterdatei für den nächsten Auftrag wurde erfolgreich fertiggestellt und hier gespeichert: '+ dstBucket +" / "+ dstKey,
            url: getUrlFromBucket(dstBucket, dstKey)
        }),
    };
    return response;
};

/********************************* Assemble URL Link****************************/
const getUrlFromBucket=(bucket,fileName)=>{
    return 'https://'+bucket+'.s3.eu-central-1.amazonaws.com/'+fileName
};