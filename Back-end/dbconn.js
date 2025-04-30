const mysql = require('mysql');

const conn = mysql.createPool({
    connectionLimit: 10,
    host     : '202.28.34.197',
    user     : 'ts_66011212090',
    password : '66011212090@csmsu',
    database : 'ts_66011212090'

});

module.exports = conn;