const api = {};
const mysql = require('mysql');
const dotenv = require('dotenv');
const pools = require('./pool.js');
const logs = require('./logs.js');
const axios = require('axios');
const fs = require('fs');
const e = require('express');
dotenv.config();


//current active node
const con = pools[process.argv[2]];

api.connect = function(callback) {
    con.getConnection(function(err, connection) {
        if (err) throw err;
        callback();
    });
}
api.whereAmI = function(req, res) {
    return res.status(200).send(process.argv[2]); 
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
    var offset = req.body.offset || 0;
    var where_clause = "WHERE ";
    var flag = false;
    var islandgroup = req.query.islandgroup;
    var island_node_match = false;
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
    if (islandgroup == 'Luzon' && (process.argv[2] == 'luzon_node' || process.argv[2] == 'central_node')) {
        island_node_match = true;
    }
    if (islandgroup == 'Visayas' && process.argv[2] == 'vismin_node' || islandgroup == 'Mindanao' && process.argv[2] == 'vismin_node' || process.argv[2] == 'central_node') {
        island_node_match = true;
    }
    if (islandgroup == undefined){
        island_node_match = true;
    }
    console.log(query);
    if (island_node_match) {
        con.getConnection(function(err, connection) {
            if (err) {
                return res.status(400).send({message: err});
            }
            con.query(query, function(err, result) {
                connection.release();
                if (err) {
                    return res.status(400).send({message: err});
                }
                return res.status(200).send(result);
            });
            
        });
    } else {
        if (process.argv[2] == 'luzon_node') {
            pools.vismin_node.getConnection(function(err, connection) {
                if (err) {
                    return res.status(400).send({message: err});
                }
                pools.vismin_node.query(query, function(err, vismin_result) {
                    connection.release();
                    if (err) {
                        return res.status(400).send({message: err});
                    }
                    return res.status(200).send(vismin_result);
                });
            });
        } else {
            pools.luzon_node.getConnection(function(err, connection) {
                if (err) {
                    return res.status(400).send({message: err});
                }

                pools.luzon_node.query(query, function(err, luzon_result) {
                    connection.release();
                    if (err) {
                        return res.status(400).send({message: err});
                    }
                    return res.status(200).send(luzon_result);
                });
            });
        }
    }
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
        if (key != 'apptid_arr' && key != 'replicate') {
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
                return res.status(400).send({message: "An error occured while attempting to process the request, please try again"});
            }
            if (logs.log(`${transaction_id} START UPDATE`)) {
                //Transaction officially starts here
                console.log(`Transaction ${transaction_id} started`);

                //read(X)
                con.query(`SELECT * FROM ${process.env.DB_NAME}.appointments WHERE apptid IN (${apptid_arr.join()});`, function(err, read_result) {
                    if (err) {
                        return res.status(400).send({message: 'An error occured while reading from the database, please try the inputs again'});
                    }
                    //write(X)
                    for (let i = 0; i < read_result.length; i++) {
                        for (key in update_values) {
                            read_result[i][key] = update_values[key];
                        }

                        let values = [];
                        for (let key in read_result[i]) {
                            //console.log(typeof read_result[i][key]);
                            if (typeof read_result[i][key] == 'object') {
                                //assume it is a date
                                values.push(read_result[i][key].toISOString().slice(0, -1));
                            } else {
                                values.push(read_result[i][key]);
                            }
                        }

                        logs.log(`${transaction_id} ${values.join()}`);
                    }

                    //partial commit
                    logs.log(`${transaction_id} COMMIT`);
                    
                    //actual commit
                    con.query(query, function(err, result){
                        if (err) {
                            console.log(err);
                            return res.status(400).send({message: 'An error occured while updating the database, please run the redo function'});
                        }
                        
                        res.status(200).send({message: 'Successfully updated'});

                        //replication
                        if (req.query.replicate == undefined){
                            logs.replicate(decodeURIComponent(req.originalUrl));
                        }
                        
                        logs.log(`CHECKPOINT ${Date.now()}`);
                        return;
                    });
                });
            } else {
                return res.status(400).send({message: 'An error occured, please try again'});
            }
        });
    }
    return;
};

api.delete = function(req, res) {
    var apptid_arr = req.query.apptid_arr;
    try {
        apptid_arr=apptid_arr.replace(/\[|\]/g,'').split(',');
    } catch (err) {
        return res.status(400).send({message: 'Invalid apptid_arr'});
    }
    var query = `DELETE FROM ${process.env.DB_NAME}.appointments WHERE apptid IN (${apptid_arr.join()});`;
    console.log(query);

    generateUUID(function(err, transaction_id) {
        if (err) {
            return res.status(400).send({message: "An error occured while attempting to process the request, please try again"});
        }

        if (logs.log(`${transaction_id} START DELETE`)) {
            console.log(`Transaction ${transaction_id} started`);

            //read(X)
            con.query(`SELECT * FROM ${process.env.DB_NAME}.appointments WHERE apptid IN (${apptid_arr.join()}); `, function(err, read_result) {
                if(err) {
                    return res.status(400).send({message: 'An error occured while reading from the database, please try the inputs again'});
                }

                //write(X)
                for (let i = 0; i < read_result.length; i++) {
                    let values = [];
                    for (let key in read_result[i]) {
                        //console.log(typeof read_result[i][key]);
                        if (typeof read_result[i][key] == 'object') {
                            //assume it is a date
                            values.push(read_result[i][key].toISOString().slice(0, -1));
                        } else {
                            values.push(read_result[i][key]);
                        }
                    }
                    logs.log(`${transaction_id} ${values.join()}`);
                }

                //partial commit
                logs.log(`${transaction_id} COMMIT`);

                //actual commit
                con.query(query, function(err, result){
                    if (err) {
                        return res.status(400).send({message: 'An error occured while deleting the database, please run the redo function'});
                    }

                    res.status(200).send({message: 'Successfully deleted'});

                    //replication
                    if (req.query.replicate == undefined){
                        logs.replicate(decodeURIComponent(req.originalUrl));
                    }
                    logs.log(`CHECKPOINT ${Date.now()}`);
                    return;
                });
            });
        }
        return; 
    });
};

api.insert = function(req, res) {
    //var query = `INSERT INTO ${process.env.DB_NAME}.appointments ()`;
    console.log(pools.db_columns);
    var query = `INSERT INTO ${process.env.DB_NAME}.appointments (${pools.db_columns.join()}) VALUES (`;
    var islandgroup = req.query.islandgroup;
    var island_node_match = false;

    if (islandgroup == 'Luzon' && (process.argv[2] == 'luzon_node' || process.argv[2] == 'central_node')) {
        island_node_match = true;
    }
    if (islandgroup == 'Visayas' && process.argv[2] == 'vismin_node' || islandgroup == 'Mindanao' && process.argv[2] == 'vismin_node' || process.argv[2] == 'central_node') {
        island_node_match = true;
    }
    if (islandgroup == undefined){
        island_node_match = true;
    }

    generateUUID(function(err, transaction_id) {
        generateUUID(function(err, apptid) {
            if (err) {
                return res.status(400).send({message: "An error occured while attempting to process the request, please try again"});
            }

            if (logs.log(`${transaction_id} START INSERT`)) {
                console.log(`Transaction ${transaction_id} started`);
                query += `'${apptid}', `;
                let values = [apptid];
                for (let i = 0; i < pools.db_columns.length; i++) {
                    if (pools.db_columns[i] == 'apptid')
                    {
                        console.log('apptid')
                        continue;
                    }
                    if (req.query[pools.db_columns[i]] != undefined) {
                        query += `'${req.query[pools.db_columns[i]]}', `;
                        values.push(req.query[pools.db_columns[i]]);
                    }
                    else {
                        query += 'NULL, ';
                        values.push(null);
                    };
                }
                query = query.slice(0, -2) + ');';

                logs.log(`${transaction_id} ${values.join()}`);
                logs.log(`${transaction_id} COMMIT`);

                if (island_node_match) {
                    con.query(query, function(err, result) {
                        if (err) {
                            return res.status(400).send({message: 'An error occured while inserting into the database, please run the redo function', error: err});
                        }
                        res.status(200).send({message: 'Successfully inserted'});

                        //replication
                        if (req.query.replicate == undefined){
                            logs.replicate(decodeURIComponent(req.originalUrl));
                        }
                        logs.log(`CHECKPOINT ${Date.now()}`);
                        return;
                    });
                } else {
                    if (req.query.replicate == undefined) {
                        logs.replicate(decodeURIComponent(req.originalUrl));
                        logs.log(`CHECKPOINT ${Date.now()}`);
                    }
                }
            }
        });
    });


};

api.startup = function() {
    //ask for logs from other nodes
    // if there are discrepancies, redo
    console.log("Starting up...");

    logs.perform_transactions_after_checkpoint(function() {
        console.log("Transactions after checkpoint completed");
        logs.perform_transactions_from_crashpoint(function() {
            console.log("Transactions from crashpoint completed");
            logs.log(`CHECKPOINT ${Date.now()}`); //checkpoint
        });
    });
    
    // const readStream = fs_reverse('logs.txt', {});

    // readStream.on('data', function (line) {
    //     console.log(line.toString());
    // }); 
}
function generateUUID(callback) {
    con.query(`SELECT REPLACE(UUID(), "-", "") AS UUID`, function(err, result) {
        if (err) {
            callback(err, null);
        }
        callback(null, result[0].UUID); 
    });
}

api.getappt = function(req, res) {
    var query = `SELECT * FROM ${process.env.DB_NAME}.appointments WHERE apptid = '${req.params.apptid}';`;
    console.log(query);
    var query_result = [];

    con.query(query, function(err, result) {
        if (err) {
            return res.status(400).send({message: err});
        }

        if (result.length == 0) {
            pools.central_node.query(query, function(err, central_result) {
                if (err) {
                    if (process.argv[2] == 'luzon_node') {
                        pools.vismin_node.query(query, function(err, vismin_result) {
                            if (err) {
                                return res.status(400).send({message: err});
                            }

                            if (vismin_result.length == 0) {
                                return res.status(400).send({message: 'No such appointment found'});
                            }
                            return res.status(200).send(vismin_result);
                        });
                    } else {
                        pools.luzon_node.query(query, function(err, luzon_result) {
                            if (err) {
                                return res.status(400).send({message: err});
                            }

                            if (luzon_result.length == 0) {
                                return res.status(400).send({message: 'No such appointment found'});
                            }
                            return res.status(200).send(luzon_result);
                        });
                    }
                } else {
                    if (central_result.length == 0) {
                        if (process.argv[2] == 'luzon_node') {
                            pools.vismin_node.query(query, function(err, vismin_result) {
                                if (err) {
                                    return res.status(400).send({message: err});
                                }
    
                                if (vismin_result.length == 0) {
                                    return res.status(400).send({message: 'No such appointment found'});
                                }
                                return res.status(200).send(vismin_result);
                            });
                        } else {
                            pools.luzon_node.query(query, function(err, luzon_result) {
                                if (err) {
                                    return res.status(400).send({message: err});
                                }
    
                                if (luzon_result.length == 0) {
                                    return res.status(400).send({message: 'No such appointment found'});
                                }
                                return res.status(200).send(luzon_result);
                            });
                        }
                    } else {
                        return res.status(200).send(central_result);
                    }
                }

            });
        } else {
            return res.status(200).send(result);
        }
    });
}

api.getlogs = function(req, res) {
    //read logs.txt using fs
    try {
        return res.status(200).send(fs.readFileSync('logs.txt', 'utf8'));
    } catch (err) {
        return res.status(400).send({message: 'An error occured while reading the logs'});
    }

}

api.getdashboard = function(req, res) {
    var result = {}
    var dashboard_query = `SELECT SUM(CASE WHEN islandgroup = 'Luzon' THEN 1 ELSE 0 END) AS luzoncount, SUM(CASE WHEN islandgroup = 'Visayas' THEN 1 ELSE 0 END) AS visayascount, SUM(CASE WHEN islandgroup = 'Mindanao' THEN 1 ELSE 0 END) AS mindanaocount, SUM(CASE WHEN islandgroup = 'Luzon' AND isvirtual = true THEN 1 ELSE 0 END) AS virtualluzoncount, SUM(CASE WHEN islandgroup = 'Visayas' AND isvirtual = true THEN 1 ELSE 0 END) AS virtualvisayascount, SUM(CASE WHEN islandgroup = 'Mindanao' AND isvirtual = true THEN 1 ELSE 0 END) AS virtualmindanaocount, COUNT(DISTINCT CASE WHEN islandgroup = 'Luzon' THEN doctorid END) AS luzondoctor, COUNT(DISTINCT CASE WHEN islandgroup = 'Visayas' THEN doctorid END) AS visayasdoctor, COUNT(DISTINCT CASE WHEN islandgroup = 'Mindanao' THEN doctorid END) AS mindanaodoctor, COUNT(DISTINCT CASE WHEN islandgroup = 'Luzon' THEN clinicid END) AS luzonclinic, COUNT(DISTINCT CASE WHEN islandgroup = 'Visayas' THEN clinicid END) AS visayasclinic, COUNT(DISTINCT CASE WHEN islandgroup = 'Mindanao' THEN clinicid END) AS mindanaoclinic, COUNT(DISTINCT CASE WHEN islandgroup = 'Luzon' THEN pxid END) AS luzonpx, COUNT(DISTINCT CASE WHEN islandgroup = 'Visayas' THEN pxid END) AS visayaspx, COUNT(DISTINCT CASE WHEN islandgroup = 'Mindanao' THEN pxid END) AS mindanaopx, SUM(CASE WHEN islandgroup = 'Luzon' AND apptstatus = 'Complete' THEN 1 ELSE 0 END) AS luzoncomplete, SUM(CASE WHEN islandgroup = 'Visayas' AND apptstatus = 'Complete' THEN 1 ELSE 0 END) AS visayascomplete, SUM(CASE WHEN islandgroup = 'Mindanao' AND apptstatus = 'Complete' THEN 1 ELSE 0 END) AS mindanaocomplete, SUM(CASE WHEN islandgroup = 'Luzon' AND apptstatus = 'Queued' THEN 1 ELSE 0 END) AS luzonqueued, SUM(CASE WHEN islandgroup = 'Visayas' AND apptstatus = 'Queued' THEN 1 ELSE 0 END) AS visayasqueued, SUM(CASE WHEN islandgroup = 'Mindanao' AND apptstatus = 'Queued' THEN 1 ELSE 0 END) AS mindanaoqueued, SUM(CASE WHEN islandgroup = 'Luzon' AND apptstatus = 'Serving' THEN 1 ELSE 0 END) AS luzonserving, SUM(CASE WHEN islandgroup = 'Visayas' AND apptstatus = 'Serving' THEN 1 ELSE 0 END) AS visayasserving, SUM(CASE WHEN islandgroup = 'Mindanao' AND apptstatus = 'Serving' THEN 1 ELSE 0 END) AS mindanaoserving, SUM(CASE WHEN islandgroup = 'Luzon' AND apptstatus = 'Skip' THEN 1 ELSE 0 END) AS luzonskipped, SUM(CASE WHEN islandgroup = 'Visayas' AND apptstatus = 'Skip' THEN 1 ELSE 0 END) AS visayasskipped, SUM(CASE WHEN islandgroup = 'Mindanao' AND apptstatus = 'Skip' THEN 1 ELSE 0 END) AS mindanaoskipped, SUM(CASE WHEN islandgroup = 'Luzon' AND apptstatus = 'NoShow' THEN 1 ELSE 0 END) AS luzonnoshow, SUM(CASE WHEN islandgroup = 'Visayas' AND apptstatus = 'NoShow' THEN 1 ELSE 0 END) AS visayasnoshow, SUM(CASE WHEN islandgroup = 'Mindanao' AND apptstatus = 'NoShow' THEN 1 ELSE 0 END) AS mindanaonoshow, SUM(CASE WHEN islandgroup = 'Luzon' AND apptstatus = 'Cancel' THEN 1 ELSE 0 END) AS luzoncancel, SUM(CASE WHEN islandgroup = 'Visayas' AND apptstatus = 'Cancel' THEN 1 ELSE 0 END) AS visayascancel, SUM(CASE WHEN islandgroup = 'Mindanao' AND apptstatus = 'Cancel' THEN 1 ELSE 0 END) AS mindanaocancel FROM mco2database.appointments`
    
    con.query(dashboard_query, function(err, result) {
        if (err) {
            return res.status(400).send({message: err});
        }
        return res.status(200).send(result[0]);
    });

}
module.exports = api;