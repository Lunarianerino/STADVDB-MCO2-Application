const api = {};
const mysql = require('mysql');
const dotenv = require('dotenv');
//const axios = require('axios');
dotenv.config();

const con = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'aristeo0',
    database: 'mco2database_vismin'
})

const central_node = mysql.createPool({
    host: process.env.DB_FULL,
    port: process.env.DB_FULL_PORT,
    user: process.env.DB_USER,
    database: process.env.DB,
    password: process.env.DB_PASSWORD,
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60000,
    queueLimit: 0
});

const luzon_node = mysql.createPool({
    host: process.env.DB_LUZON,
    port: process.env.DB_LUZON_PORT,
    user: process.env.DB_USER,
    database: process.env.DB,
    password: process.env.DB_PASSWORD,
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60000,
    queueLimit: 0
});

const vismin_node = mysql.createPool({
    host: process.env.DB_VISMIN,
    port: process.env.DB_VISMIN_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB,
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60000,
    queueLimit: 0
});
api.connect = function(callback) {
    con.connect(function(err) {
        if (err) throw err;
        callback();
    });
}

api.checkNodes = async function(req, res) {
    let nodes = {};
    central_node.getConnection(function(err, connection) {
        if (err) {
            nodes.CENTRAL_NODE = 400;
            console.log(err)
        } else {
            nodes.CENTRAL_NODE = 200;
        }
        luzon_node.getConnection(function(err, connection) {
            if (err) {
                nodes.LUZON_NODE = 400;
            } else {
                nodes.LUZON_NODE = 200;
            }
            vismin_node.getConnection(function(err, connection) {
                if (err) {
                    nodes.VISMIN_NODE = 400;
                } else {
                    nodes.VISMIN_NODE = 200;
                }
                console.log(nodes);
                res.status(200).send(nodes);
                connection.release();
            });
            connection.release();
        });
        connection.release();
        return;
    });
}

api.status = function(req, res) {
    res.status(200).send('Node: ' + process.argv[2] + ' is running');
};

// NOTE: IF you want to query by apptid, dont add offset
api.find = async function(req, res) {
    var limit = req.body.limit || 10;
    var offset = req.body.offset * limit || 0;
    var where_clause = "WHERE ";
    var flag = false;
    
    console.log(req.body);
    for (key in req.body) {
        if (key != 'limit' && key != 'offset') {
            where_clause += key + " = '" + req.body[key] + "' AND ";
            flag = true;
        }
    }

    if (!flag) where_clause = ""; // if there is no condition
    else where_clause = where_clause.slice(0, -4); // remove the last 'AND'
    // add the limit and offset
    where_clause += " LIMIT " + limit + " OFFSET " + offset;

    var query = `SELECT * FROM ${process.env.DB}.appointments ${where_clause};`;
    con.query(query, function(err, result) {
    if (err){
        return res.status(400).send({message: err});
    };
    return res.status(200).send(result);
    });
};
api.update = function(req, res) {
    var query = `UPDATE ${process.env.DB}.appointments SET `;
    var flag = false;

    //EVERYTHING IN HERE HAS TO BE STRING, E.G apptid_arr = ["1","2","3"]
    var apptid_arr = req.body.apptid_arr;
    apptid_arr=apptid_arr.replace(/\[|\]/g,'').split(',');
    console.log(apptid_arr[0])

    for(key in req.body) {
        if (key != 'apptid_arr') {
            query += key + " = '" + req.body[key] + "', ";
            flag = true;
        }
    }
    if (!flag) {
        res.status(400).send({message: 'No data to update'});
    } else {
        query = query.slice(0, -2); // remove the last ','
        query += " WHERE apptid IN(" + apptid_arr.join() + ");";
        console.log(query);
        con.query(query, function(err, result) {
            if (err) {
                return res.status(400).send({message: err});
            }
            return res.status(200).send({message: 'Successfully updated'});
        });
    }
};
api.delete = function(req, res) {
    
    var apptid_arr = req.body.apptid_arr;
    apptid_arr=apptid_arr.replace(/\[|\]/g,'').split(',');
    var query = `DELETE FROM ${process.env.DB}.appointments WHERE apptid IN (${apptid_arr.join()});`;
    console.log(query);

    con.query(query, function(err, result) {
        if (err) {
            return res.status(400).send({message: err});
        }
        return res.status(200).send({message: 'Successfully deleted'});
    });
};
module.exports = api;