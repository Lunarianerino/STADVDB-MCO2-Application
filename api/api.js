const api = {};
const mysql = require('mysql');
const dotenv = require('dotenv');
const pools = require('./pool.js');
const logs = require('./logs.js');
const axios = require('axios');
dotenv.config();


//current active node
const con = pools[process.argv[2]];

api.connect = function(callback) {
    con.getConnection(function(err, connection) {
        if (err) throw err;
        callback();
    });
}

api.checkNodes = async function(req, res) {
    let nodes = {};
    pools.central_node.getConnection(function(err, connection) {
        if (err) {
            nodes.CENTRAL_NODE = 400;
        } else {
            nodes.CENTRAL_NODE = 200;
        }
        pools.luzon_node.getConnection(function(err, connection) {
            if (err) {
                nodes.LUZON_NODE = 400;
            } else {
                nodes.LUZON_NODE = 200;
            }
            pools.vismin_node.getConnection(function(err, connection) {
                if (err) {
                    nodes.VISMIN_NODE = 400;
                } else {
                    nodes.VISMIN_NODE = 200;
                }
                res.status(200).send(nodes);
                if (!err) connection.release();
            });
            if (!err) connection.release();
        });
        if (!err) connection.release();
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
    
    console.log(req.query);
    for (key in req.query) {
        if (key != 'limit' && key != 'offset') {
            where_clause += key + " = '" + req.query[key] + "' AND ";
            flag = true;
        }
    }

    if (!flag) where_clause = ""; // if there is no condition
    else where_clause = where_clause.slice(0, -4); // remove the last 'AND'
    // add the limit and offset
    where_clause += " LIMIT " + limit + " OFFSET " + offset;

    var query = `SELECT * FROM ${process.env.DB_NAME}.appointments ${where_clause};`;
    console.info(query)
    con.query(query, function(err, result) {
    if (err){
        return res.status(400).send({message: err});
    };
    return res.status(200).send(result);
    });
};

api.update = async function(req, res) {
    var query = `UPDATE ${process.env.DB_NAME}.appointments SET `;
    var flag = false;

    //EVERYTHING IN HERE HAS TO BE STRING, E.G apptid_arr = ["1","2","3"]
    var apptid_arr = req.query.apptid_arr;
    try {
        apptid_arr=apptid_arr.replace(/\[|\]/g,'').split(',');
    } catch (err) {
        return res.status(400).send({message: 'Invalid apptid_arr'});
    }
    
    var update_values = {};

    for(key in req.query) {
        if (key != 'apptid_arr') {
            update_values[key] = req.query[key];
            query += key + " = '" + req.query[key] + "', ";
            flag = true;
        }
    }
    if (!flag) {
        res.status(400).send({message: 'No data to update'});
    } else {
        query = query.slice(0, -2); // remove the last ','
        query = query.replace('/"/"', '"');//remove the first and last ""
        query += " WHERE apptid IN(" + apptid_arr.join() + ");";
        console.log(query);

        generateUUID(function(err, transaction_id) {
            if (err) {
                return res.status(400).send({message: err});
            }
            if (logs.log(`${transaction_id} START`)) {
                //Transaction officially starts here
                console.log(`Transaction ${transaction_id} started`);

                //read(X)
                con.query(`SELECT * FROM ${process.env.DB_NAME}.appointments WHERE apptid IN (${apptid_arr.join()});`, function(err, insert_result) {
                    if (err) {
                        return res.status(400).send({message: 'An error occured while reading from the database, please try the inputs again'});
                    }

                    //write(X)
                    for (let i = 0; i < insert_result.length; i++) {
                        for (key in update_values) {
                            insert_result[i][key] = update_values[key];
                        }

                        let values = Object.values(insert_result[i]);
                        logs.log(`${transaction_id}, ${values.join()}`);
                    }

                    //partial commit
                    logs.log(`${transaction_id} COMMIT`);
                    console.log(query);
                    
                    //actual commit
                    con.query(query, function(err, result){
                        if (err) {
                            return res.status(400).send({message: 'An error occured while updating the database, please run the redo function'});
                        }
                        
                        res.status(200).send({message: 'Successfully updated'});

                        if (process.argv[2] == 'central_node') {
                            //stuff
                        } else if (process.argv[2] == 'luzon_node') {
                            axios.get(`http://${process.env.DB_FULL}:80${decodeURIComponent(req.originalUrl)}`).then((response) => {
                                console.log(response.data);
                            }).catch((error) => {
                                logs.log(`${Date.now()} CENTRAL_NODE DOWN`);
                                console.error(error);
                            });
                        } else if (process.argv[2] == 'vismin_node') {
                            //stuff
                        }

                        logs.log(`${Date.now()} CHECKPOINT`);
                    });
                });
            } else {
                return res.status(400).send({message: 'An error occured, please try again'});
            }
        });
    }
};

api.delete = function(req, res) {
    var apptid_arr = req.query.apptid_arr;
    apptid_arr=apptid_arr.replace(/\[|\]/g,'').split(',');
    var query = `DELETE FROM ${process.env.DB_NAME}.appointments WHERE apptid IN (${apptid_arr.join()});`;
    console.log(query);

    con.query(query, function(err, result) {
        if (err) {
            return res.status(400).send({message: err});
        }
        return res.status(200).send({message: 'Successfully deleted'});
    });
};

function generateUUID(callback) {
    con.query(`SELECT REPLACE(UUID(), "-", "") AS UUID`, function(err, result) {
        if (err) {
            callback(err, null);
        }
        callback(null, result[0].UUID); 
    });
}
module.exports = api;