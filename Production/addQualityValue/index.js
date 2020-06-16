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

    chargesNum = data.chargesNum;

    try {

        await getQualityValues(event);

        return result;
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

            console.log(res.data);
            result = res.data
            return data;
        })
        .catch((error) => {
            console.error(error)
        })
}