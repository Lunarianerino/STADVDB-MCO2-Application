const api = {};
const mysql = require('mysql');
const dotenv = require('dotenv');
const axios = require('axios');
dotenv.config();

const con = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'aristeo0',
    database: process.env.DB_NAME
})

api.connect = function(callback) {
    con.connect(function(err) {
        if (err) throw err;
        callback();
    });
}

api.checkNodes = async function(req, res) {
    var nodes = {};
    var nodesList = ['MASTER', 'SLAVE_LUZON', 'SLAVE_VISMIN'];
    //TODO: REVISE
    for (node of nodesList) {
        await axios.get(process.env[node] + '/api/status')
        .then(res => {        
            nodes[node] = res.status;
        })
        .catch(err => {
            nodes[node] = 400;
        });
    }
    res.send(nodes);
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