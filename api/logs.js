const pools = require('./pool.js');
const fs = require('fs');
//current active node
const con = pools[process.argv[2]];

const logs = {};

//details is an object containing {islandgroup: string, action: string, apptid: string}
//logs will be stored as Transaction#, action, V1 (if applicable), V2 (ifapplicable), DateTime
logs.log = function(log) {
    try {
        fs.appendFileSync('logs.txt', log + '\n', 'utf-8');
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}

module.exports = logs;