var mysql = require('mysql');
var dotenv = require('dotenv');
dotenv.config();

var pools = {};

pools.central_node = mysql.createPool({
    host: process.env.CENTRAL_NODE,
    port: process.env.CENTRAL_DB_PORT,
    user: process.env.DB_USER,
    database: process.env.DB,
    password: process.env.DB_PASSWORD,
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60000,
    queueLimit: 0
});

pools.luzon_node = mysql.createPool({
    host: process.env.LUZON_NODE,
    port: process.env.LUZON_DB_PORT,
    user: process.env.DB_USER,
    database: process.env.DB,
    password: process.env.DB_PASSWORD,
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60000,
    queueLimit: 0
});

pools.vismin_node = mysql.createPool({
    host: process.env.VISMIN_NODE,
    port: process.env.VISMIN_DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB,
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60000,
    queueLimit: 0
});

module.exports = pools;