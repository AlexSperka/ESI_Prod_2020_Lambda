// https://stackoverflow.com/questions/55206407/nodejs-csv-data-dump-into-s3-object

var AWS = require('aws-sdk');
var moment = require("moment-timezone");
// const json2csvParser = require('json2csv');
const { parse } = require('json2csv');

// get reference to S3 client
const s3 = new AWS.S3();

var output = 'Default';
var myBody = Buffer.from(output);

var dstBucket = 'esi-prod-bucket';

var qualityCSV = 'qualityValues-';
var dstKey = 'Default.csv';

exports.handler = async (event, context, callback) => {

    console.log(event);
    // var date = moment();
    var time = moment().format('_HH-mm');  //get UTC Time
    var date = moment().format('DD.MM.YYYY');
    console.log("date & time UTC: " + time + " and " + date);

    try {
        let dataCSV = JSON.stringify(event);
        dataCSV = JSON.parse(dataCSV);

        const fields = ['ProdSortNum','prodOrderNum','articleNumber','colorHEX','colorCyan','colorMagenta','colorYellow','colorKey','quantity','hasPrint','motiveNumber'];
        const opts = {fields};
        const csv = parse(dataCSV.results, opts);

        dstKey = qualityCSV+date+time+'.csv';

        const destparams = {
            Bucket: dstBucket,
            Key: dstKey,
            // Body: myBody,
            Body: Buffer.from(csv),
        };

        const putResult = await s3.putObject(destparams).promise();

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


const getUrlFromBucket=(bucket,fileName)=>{
    return 'https://'+bucket+'.s3.eu-central-1.amazonaws.com/'+fileName
};