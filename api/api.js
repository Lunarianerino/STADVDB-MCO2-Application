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

                        let values = Object.values(read_result[i]);
                        logs.log(`${transaction_id} ${values.join()}`);
                    }

                    //partial commit
                    logs.log(`${transaction_id} COMMIT`);
                    
                    //actual commit
                    con.query(query, function(err, result){
                        if (err) {
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
                    logs.log(`${transaction_id} ${Object.values(read_result[i]).join()}`);
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
    console.log(api.columns);
    var query = `INSERT INTO ${process.env.DB_NAME}.appointments (${api.columns.join()}) VALUES (`;

    generateUUID(function(err, transaction_id) {
        generateUUID(function(err, apptid) {
            if (err) {
                return res.status(400).send({message: "An error occured while attempting to process the request, please try again"});
            }

            if (logs.log(`${transaction_id} START INSERT`)) {
                console.log(`Transaction ${transaction_id} started`);
                query += `'${apptid}', `;
                let values = [apptid];
                for (let i = 0; i < api.columns.length; i++) {
                    if (api.columns[i] == 'apptid')
                    {
                        console.log('apptid')
                        continue;
                    }
                    if (req.query[api.columns[i]] != undefined) {
                        query += `'${req.query[api.columns[i]]}', `;
                        values.push(req.query[api.columns[i]]);
                    }
                    else {
                        query += 'NULL, ';
                        values.push(null);
                    };
                }
                query = query.slice(0, -2) + ');';

                logs.log(`${transaction_id} ${values.join()}`);
                logs.log(`${transaction_id} COMMIT`);

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
            }
        });
    });


};

api.startup = function(req, res) {
    //ask for logs from other nodes
    // if there are discrepancies, redo
    console.log("Starting up...");

    con.query(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='${process.env.DB_NAME}' AND TABLE_NAME='appointments';`, function(err, result) {
        if (err) {
            return res.status(400).send({message: err});
        }
        var columns = [];
        for (let i = 0; i < result.length; i++) {
            columns.push(result[i].COLUMN_NAME);
        }

        //pray this finishes before the set up
        api.columns = columns;
    });
    
    console.log("Startup complete");
    logs.perform_transactions_after_checkpoint();
    
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

    con.query(query, function(err, result) {
        if (err) {
            return res.status(400).send({message: err});
        }
        return res.status(200).send(result);
    });
}
module.exports = api;