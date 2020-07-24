/**
 * Function to get Quality Values from MAWI API and forward it to Prod Frontend
 * 
 * @alias    esi_prod_addQualityValue
 * @memberof ProductionTeamESI
 * *
 * @param none, Charge Number
 *
 * @return {String} Return Quality Values from Mawi
 */

/********************************* Librarys ***********************************/

const axios = require('axios');

var result = 0;

var chargesNum = 0;

exports.handler = async (event) => {
    // TODO implement
    let data = JSON.stringify(event);
    data = JSON.parse(data);

    chargesNum = parseInt( data.chargesNum );

    try {

        await getQualityValues(event);
        
        var responseID = JSON.stringify(result)
        responseID = JSON.parse(responseID)
        console.log("Result: "+ responseID.idcharges)
        
        if(responseID.idcharges === chargesNum)
        {
        return result;
        } else {
            return 'Die Charge mit der ID = ' + chargesNum + ' existiert nicht.'
        }
        //return { "url": data };

    } catch (error) {
        console.log(error);
        return { "result": "That did not work" };
    }
};

/********************************* Call Lambda function CreateCSV ******************************/
async function getQualityValues(data) {
    let parsed;

    var responseCreateCSV = 0;
    console.log("Called response Create CSV");

    await axios.get('https://423rw0hwdj.execute-api.eu-central-1.amazonaws.com/Prod/charges/' + chargesNum.toString())
        .then((res) => {

            result = res.data
            console.log(res.data);

            return data;
        })
        .catch((error) => {
            console.error(error)
        })
}