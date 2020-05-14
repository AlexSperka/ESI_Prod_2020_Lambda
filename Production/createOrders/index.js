exports.handler = async (event) => {
    // TODO implement
    const response = {
        statusCode: 200,
        body: JSON.stringify({
            data: 'Neue Aufträge wurden erfolgreich zur Datenbank hinzugefügt!'
        }),
    };
    return response;
};
