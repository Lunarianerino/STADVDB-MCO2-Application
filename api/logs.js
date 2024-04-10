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

logs.redo_transaction = function(transaction){
    var query = "";

    for (let i = 0; i < transaction.V.length; i++) {
        var query = "";
        let details = transaction.V[i].split(',');

        for(let i = 0; i < details.length; i++) {
            if (details[i] == "") {
                details[i] = "NULL";
            }
        }

        if (transaction.action != 'DELETE') {
            query = `INSERT INTO ${process.env.DB_NAME}.appointments (${pools.db_columns.join(',')}) VALUES ("${details.join('","')}") ON DUPLICATE KEY UPDATE `;
            for (let i = 0; i < pools.db_columns.length; i++) {
                //if (pools.db_columns[i] == 'apptid') continue;
                query += `${pools.db_columns[i]} = "${details[i]}", `;
            }
            query = query.slice(0, -2);
        } else {
            query = `DELETE FROM ${process.env.DB_NAME}.appointments WHERE apptid = "${details[0]}"`;
        }

        console.log(query);
            con.query(query, function(err, result) {
                if (err) {
                    console.error(err);
                }
                console.log(`Transaction ${transaction.action} for ${details[0]} completed`);
            });
    }
}

logs.replicate = function(url){
    console.log("Starting Replication");
    if (process.argv[2] == 'central_node') {
        console.log("Replicating from Central Node");
        axios.get(`http://${process.env.LUZON_NODE}:${process.env.LUZON_NODE_PORT}${url}&replicate=true`).then((response) => {
            logs.log(`LUZON_NODE CHECKPOINT ${Date.now()}`);
            console.log(response.data);
        }).catch((error) => {
            logs.log(`LUZON_NODE ERROR ${Date.now()}`);
            //console.error(error);
        });

        axios.get(`http://${process.env.VISMIN_NODE}:${process.env.VISMIN_NODE_PORT}${url}&replicate=true`).then((response) => {
            logs.log(`VISMIN_NODE CHECKPOINT ${Date.now()}`);
            console.log(response.data);
        }).catch((error) => {
            logs.log(`VISMIN_NODE ERROR ${Date.now()}`);
            //console.error(error);
        });
    } else if (process.argv[2] == 'luzon_node' || process.argv[2] == 'vismin_node') {
        axios.get(`http://${process.env.CENTRAL_NODE}:${process.env.CENTRAL_NODE_PORT}${url}&replicate=true`).then((response) => {
            logs.log(`CENTRAL_NODE CHECKPOINT ${Date.now()}`);
            console.log(response.data);
        }).catch((error) => {
            logs.log(`CENTRAL_NODE ERROR ${Date.now()}`);
        });
    }
}

logs.perform_transactions_after_checkpoint = function() {
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
        console.log("Reading Done");

        let keys = Object.keys(transactions).reverse();
        for (let i = 0; i < keys.length; i++) {
            let transaction = transactions[keys[i]];
            if (transaction.action != null) {
                console.log(transaction);
                logs.redo_transaction(transaction);
            }
        }
    }); 
    
}


module.exports = logs;