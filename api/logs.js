const pools = require('./pool.js');
const fs = require('fs');
const fs_reverse = require('fs-reverse');
const axios = require('axios');
//current active node
const con = pools[process.argv[2]];

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

logs.redo = function(){

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
                    let action = "";
                    for (let i = 1; i < log.length; i++) {
                        action += log[i]; //expected to be comma separated
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
        console.log(transactions);
    }); 
    
}


module.exports = logs;