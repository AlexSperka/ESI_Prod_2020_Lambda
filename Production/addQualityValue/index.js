exports.handler = async (event) => {
    // TODO implement
    const response = {
        statusCode: 200,
        body: JSON.stringify({
            data: 'Qualitätswerte wurden zur Datenbank hinzugefügt!'
        }),
    };
    return response;
};