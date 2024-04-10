const pools = require('./pool.js');
const fs = require('fs');
const fs_reverse = require('fs-reverse');
const axios = require('axios');
//current active node
const con = pools[process.argv[2]];
const dotenv = require('dotenv');
const api = require('./api.js');
dotenv.config();
const logs = {};

//details is an object containing {islandgroup: string, action: string, apptid: string}
//logs will be stored as Transaction#, action, V1 (if applicable), V2 (ifapplicable), DateTime
logs.log = function(log) {
    try {
        fs.appendFileSync('logs.txt', '\n' + log, 'utf-8');
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}

logs.redo_transaction = function(transaction, callback){
    for (let i = 0; i < transaction.V.length; i++) {
        var query = "";
        let details = transaction.V[i].split(',');
        var islandgroup = null;
        var island_node_match = false;
        for(let i = 0; i < details.length; i++) {
            if (details[i] == "") {
                details[i] = "NULL";
            }
        }

        if (transaction.action != 'DELETE') {
            //${details.join('","')}") ON DUPLICATE KEY UPDATE `;
            query = `INSERT INTO ${process.env.DB_NAME}.appointments (${pools.db_columns.join(',')}) VALUES (`;
            
            for (let i = 0; i < pools.db_columns.length; i++) {
                //if (pools.db_columns[i] == 'apptid') continue;
                if (pools.db_columns[i] == 'islandgroup') {
                    islandgroup = details[i];
                }

                if (details[i] == "NULL") {
                    query += `${details[i]}, `;
                } else {
                    query += `"${details[i]}", `;
                }
            }
            query = query.slice(0, -2);
            query += `) ON DUPLICATE KEY UPDATE `;

            
            for (let i = 0; i < pools.db_columns.length; i++) {
                //if (pools.db_columns[i] == 'apptid') continue;
                if (details[i] == "NULL") {
                    query += `${pools.db_columns[i]} = NULL, `;
                } else {
                    query += `${pools.db_columns[i]} = "${details[i]}", `;
                }
            }
            query = query.slice(0, -2);
        } else {
            query = `DELETE FROM ${process.env.DB_NAME}.appointments WHERE apptid = "${details[0]}"`;
        }

        //console.log(query);
        if (islandgroup == 'Luzon' && process.argv[2] == 'luzon_node') {
            island_node_match = true;
        }
        if (islandgroup == 'Visayas' && process.argv[2] == 'vismin_node' || islandgroup == 'Mindanao' && process.argv[2] == 'vismin_node') {
            island_node_match = true;
        }
        if (process.argv[2] == 'central_node') {
            island_node_match = true;
        }
        if (island_node_match) {
            con.query(query, function(err, result) {
                if (err) {
                    console.error(err);
                }
                console.log(`Transaction ${transaction.action} for ${details[0]} completed`);
                console.log(`Query: ${query}`);
                if (i == transaction.V.length - 1) {
                    callback();
                }
            });
        }
    }

}

logs.replicate = function(url){
    console.log("Starting Replication");
    if (process.argv[2] == 'central_node') {
        console.log("Replicating from Central Node");
        axios.get(`http://${process.env.LUZON_NODE}:${process.env.LUZON_NODE_PORT}${url}&replicate=true`).then((response) => {
            logs.log(`LUZON_NODE CHECKPOINT ${Date.now()}`);
            //console.log(response.data);
        }).catch((error) => {
            logs.log(`LUZON_NODE ERROR ${Date.now()}`);
            //console.error(error);
        });

        axios.get(`http://${process.env.VISMIN_NODE}:${process.env.VISMIN_NODE_PORT}${url}&replicate=true`).then((response) => {
            logs.log(`VISMIN_NODE CHECKPOINT ${Date.now()}`);
            //console.log(response.data);
        }).catch((error) => {
            logs.log(`VISMIN_NODE ERROR ${Date.now()}`);
            //console.error(error);
        });
    } else if (process.argv[2] == 'luzon_node' || process.argv[2] == 'vismin_node') {
        axios.get(`http://${process.env.CENTRAL_NODE}:${process.env.CENTRAL_NODE_PORT}${url}&replicate=true`).then((response) => {
            logs.log(`CENTRAL_NODE CHECKPOINT ${Date.now()}`);
            //console.log(response.data);
        }).catch((error) => {
            logs.log(`CENTRAL_NODE ERROR ${Date.now()}`);
        });

        //sanity check
        if (process.argv[2] == 'luzon_node') {
            axios.get(`http://${process.env.VISMIN_NODE}:${process.env.VISMIN_NODE_PORT}${url}&replicate=true`).then((response) => {
                logs.log(`VISMIN_NODE CHECKPOINT ${Date.now()}`);
                //console.log(response.data);
            }).catch((error) => {
                logs.log(`VISMIN_NODE ERROR ${Date.now()}`);
                //console.error(error);
            });
        } else {
            axios.get(`http://${process.env.LUZON_NODE}:${process.env.LUZON_NODE_PORT}${url}&replicate=true`).then((response) => {
                logs.log(`LUZON_NODE CHECKPOINT ${Date.now()}`);
                //console.log(response.data);
            }).catch((error) => {
                logs.log(`LUZON_NODE ERROR ${Date.now()}`);
                //console.error(error);
            });
        }  
    }
}

logs.perform_transactions_after_checkpoint = function(callback) {
    const readStream = fs_reverse('logs.txt', {});
    var transactions = {};
    var transactions_no_start = [];
    var checkpoint_found = false;

    readStream.on('data', function (line) {
        let log = line.toString().split(' ');

        if (log[0] == 'CHECKPOINT') {
            checkpoint_found = true;
        }

        if (log[1] == 'COMMIT' && !checkpoint_found) {
            transactions[log[0]] = {V: [], action: null};
            transactions_no_start.push(log[0]);
        } else {
            if (transactions[log[0]] != undefined) {
                if (log[1] != 'START') {
                    //push log[1] to log[n] to V
                    let action = log[1];
                    for (let i = 2; i < log.length; i++) {
                        action += ' ' + log[i]; //expected to be comma separated
                    }
                    transactions[log[0]].V.push(action);
                } else {
                    var index = transactions_no_start.indexOf(log[0]);
                    if (index !== -1) {
                        transactions_no_start.splice(index, 1);
                    }
                    transactions[log[0]].action = log[2];
                }
            }
        }

        if (checkpoint_found && transactions_no_start.length == 0) {
            readStream.destroy();
        }
    }).on('close', function() {
        let keys = Object.keys(transactions).reverse();

        if (keys.length == 0) {
            callback();
        } else {
            for (let i = 0; i < keys.length; i++) {
                let transaction = transactions[keys[i]];
                if (transaction.action != null) {
                    logs.redo_transaction(transaction, function() {
                        if(i == keys.length - 1) {
                            callback();
                        }
                    });
                }
            }
        }
    


    }).on('end', function() {
        console.log('No checkpoint found... processing all transactions');
        if (Object.keys(transactions).length == 0) {
            callback();
        } else {
            for (let i = 0; i < Object.keys(transactions).length; i++) {
                let transaction = transactions[Object.keys(transactions)[i]];
                if (transaction.action != null) {
                    logs.redo_transaction(transaction, function() {
                        if(i == Object.keys(transactions).length - 1) {
                            callback();
                        }
                    });
                }
            }
        }


    }); 
}

logs.perform_transactions_from_crashpoint = function(callback) {
    if (process.argv[2] == "central_node") {
        //it is planned to make luzon and vismin logs equal (atleast in changes)
        // get logs of the other 2 nodes and process
        axios.get(`http://${process.env.LUZON_NODE}:${process.env.LUZON_NODE_PORT}/api/getlogs`).then((response) => {
            logs.process_external_logs(response.data, function(){
                axios.get(`http://${process.env.VISMIN_NODE}:${process.env.VISMIN_NODE_PORT}/api/getlogs`).then((response) => {
                    logs.process_external_logs(response.data, function(){
                        callback();
                    });
                }).catch((error) => {
                    console.log("Vismin node is down, no logs to process");
                    callback();
                    //console.error(error);
                });
            });
        }).catch((error) => {
            axios.get(`http://${process.env.VISMIN_NODE}:${process.env.VISMIN_NODE_PORT}/api/getlogs`).then((response) => {
                logs.process_external_logs(response.data, function(){
                    console.log("Luzon node is down, no logs to process");
                    callback();
                });
            }).catch((error) => {
                console.log("Vismin node is down, no logs to process");
                callback();
                //console.error(error);
            });
        });


    } else {
        // get logs of central node and process
        axios.get(`http://${process.env.CENTRAL_NODE}:${process.env.CENTRAL_NODE_PORT}/api/getlogs`).then((response) => {
            logs.process_external_logs(response.data, function(){
                callback();
            });
        }).catch((error) => {
            console.log("Central node is down, logging from the other node");
            var ip = null;
            var port = null;
            if (process.argv[2] == "luzon_node") {
                ip = process.env.VISMIN_NODE;
                port = process.env.VISMIN_NODE_PORT;
            } else {
                ip = process.env.LUZON_NODE;
                port = process.env.LUZON_NODE_PORT;
            }

            axios.get(`http://${ip}:${port}/api/getlogs`).then((response) => {
                logs.process_external_logs(response.data, function(){
                    callback();
                });
            }).catch((error) => {
                console.log("Both nodes are down, no logs to process");
                callback();
                //console.error(error);
            });
            
            //console.error(error);
        });
    }
}

logs.process_external_logs = function(logs_str, callback) {
    var log_arr = logs_str.split('\n').reverse();
    var node = process.argv[2].toUpperCase();
    var error_flag = false;
    var checkpoint_found = false;
    var safe_flag = true;
    var transactions = {};
    var transactions_no_start = [];
    for (let i = 0; i < log_arr.length; i++) {
        let log = log_arr[i].split(' ');
        if (!error_flag) {
            if ((log[0] + ' ' + log[1]) == (node + ' CHECKPOINT')) { 
                checkpoint_found = true;
            }
        }

        //if error flag is true, this is our sign to perform recovery
        if ((log[0] + ' ' + log[1]) == (node + ' ERROR')) {
            console.log("Error detected in logs")
            error_flag = true;
        }

        if (error_flag && log[0] + ' ' + log[1] == (node + ' CHECKPOINT')) {
            checkpoint_found = true;
        }

        //if there are no errors detected, and a checkpoint has been found, the logs are still consistent and there is no need for recovery
        if (safe_flag && checkpoint_found) {
            break;
        }
        
        if (log[1] == "COMMIT" && !checkpoint_found) {
            transactions[log[0]] = {V: [], action: null};
            transactions_no_start.push(log[0]);
        } else {
            if (transactions[log[0]] != undefined) {
                if (log[1] != 'START') {
                    let action = log[1];
                    for (let i = 2; i < log.length; i++) {
                        action += ' ' + log[i]; //expected to be comma separated
                    }
                    transactions[log[0]].V.push(action);
                } else {
                    var index = transactions_no_start.indexOf(log[0]);
                    if (index != -1) {
                        transactions_no_start.splice(index, 1);
                    }
                    transactions[log[0]].action = log[2];
                }
            }
        }

        if (checkpoint_found && transactions_no_start.length == 0) {
            break;
        }
    }
    if (error_flag) {
        let keys = Object.keys(transactions).reverse();
        if (keys.length == 0) {
            callback();
        } else {
            //console.log("Performing Recovery");
            for (let i = 0; i < keys.length; i++) {
                let transaction = transactions[keys[i]];
                if (transaction.action != null) {
                    logs.redo_transaction(transaction, function() {
                        if(i == keys.length - 1) {
                            callback();
                        }
                    });
                }
            }
        }

    } else {callback();}

}

module.exports = logs;