exports.handler = async (event) => {
    // TODO implement
    const response = {
        statusCode: 200,
        body: JSON.stringify({
            data: 'MAWI wurde informiert und wird die Aufträge bald abholen!'
        }),
    };
    return response;
};
