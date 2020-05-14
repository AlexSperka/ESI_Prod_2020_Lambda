exports.handler = async (event) => {
    // TODO implement
    const response = {
        statusCode: 200,
        body: JSON.stringify({
            data: 'Die Parameterdatei für den nächsten Auftrag wurde erfolgreich fertiggestellt und hier gespeichert: D:/CSV-Files'
        }),
    };
    return response;
};
