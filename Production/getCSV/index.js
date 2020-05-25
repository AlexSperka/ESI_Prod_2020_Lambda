const AWS = require('aws-sdk');

const stepFunctions = new AWS.StepFunctions({
    region: 'eu-central-1'
    });

var moment = require("moment-timezone");

exports.handler = (event, context, callback) => {

    console.log(event);
    // var date = moment();
    var time = moment().format('_HH-mm');  //get UTC Time
    var date = moment().format('DD.MM.YYYY');
    console.log("date & time UTC: " + time + " and " + date);

    var params = {
        stateMachineArn: 'arn:aws:states:eu-central-1:149598261626:stateMachine:Production_State_Machine',
        name: 'Production_State_Machine'+time+date
    };
    
    /* https://www.youtube.com/watch?v=9MKL5Jr2zZ4 */

    // stepFunctions.startExecution(params, function (err, data) {
    stepFunctions.startExecution(params, (err, data) => {
        if (err) console.log('Error: ' + err, err.stack); // an error occurred 
        else {
            console.log('Return Data: ' + data); // successful 
            const response = {
                statusCode: 200,
                body: JSON.stringify({
                    message: 'Die Parameterdatei für den nächsten Auftrag wurde erfolgreich fertiggestellt',
                    data: data
                }),
            }
            callback(null, response);
        }
    });

    console.log("Function end");

};
