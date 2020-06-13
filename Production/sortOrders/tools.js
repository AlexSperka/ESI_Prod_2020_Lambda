/**
 * Helper Functions/Strings for MySQL Database manipulation
 *
 * @return {String} MySQL String Message
 */

/********************************* CREATE TABLE ***************/
const createTableSQL = function () {
    var queryMessage = 'CREATE TABLE ProdTable (date DATE, time TIME, endDate DATE, prodOrderNum VARCHAR(255), articleNumber INT, colorHEX VARCHAR(255), colorName VARCHAR(255), quantity INT, hasPrint TINYINT(1), motiveNumber INT, ProdSortNum INT, c TINYINT, m TINYINT, y TINYINT, k TINYINT, prodStatus VARCHAR(30), splitOrders VARCHAR(255) )';
    return (queryMessage);
};

/********************************* CREATE DATABASE*************/
const createDatabaseSQL = function () {
    var queryMessage = 'CREATE DATABASE testdb';
    return (queryMessage);
};

/********************************* ADD ROW TO DB *************/
const addRowSQL = function () {
    var queryMessage = 'ALTER TABLE testdb.ProdTable ADD deltaE FLOAT; ';
    return (queryMessage);
};

/********************************* GET STUFF FROM DB***********/
const getOrdersFromDB = function () {
    var queryMessage = 'SELECT * FROM testdb.ProdTable LIMIT 10';
    return (queryMessage);
};

/********************************* DELETE STUFF FROM DB***********/
const deleteNullRowSQL = function () {
    var queryMessage = "DELETE FROM testdb.ProdTable WHERE prodOrderNum = 'undefined'";
    return (queryMessage);
}