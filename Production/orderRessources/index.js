exports.handler = async (event) => {
    // TODO implement
    const response = {
        statusCode: 200,
        body: JSON.stringify({
            data: 'T-Shirts und Farbe sind auf dem Weg!'
        }),
    };
    return response;
};
