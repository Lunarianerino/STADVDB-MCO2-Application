const express = require('express');
const mysql = require('mysql');
//const web = require("../controllers/web.controller.js")

// var con = mysql.createConnection({
//     host: '192.168.68.108',
//     user: 'luis',
//     password: 'aristeo0',
//     database: 'mco2database_vismin'
// });

var con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'aristeo0',
    database: 'mco2database_vismin'
});
con.connect(function(err){ 
    if(err) throw err;
    console.info("Connection Successful!");
});

function query(body){
    var result = con.connect(function(err){
        if(err) throw err;
        console.info("Connection Successful!");

        var result = con.query('INSERT INTO appointments VALUES (replace(uuid(),"-",""), "Queued", NOW(), "Test", NULL, NULL, "test", NULL, NULL, "Mindanao", NULL, NULL, NULL)', function(err, result) {
            if(err) console.error('error connecting:' + err.stack);
            console.info('insert successful');
            return result;
        });

        con.end();
        return "success"
    });

    return result;
}

function query_update_one(body){
    var result = con.connect(function(err){
        if (err) throw err;
        console.info("Connection Successful!");

        //insert query here
        
    })
}

function query_select(body){

    let result = con.query(`SELECT * FROM appointments LIMIT 10`, function(err, result, fields) {
        if(err) {
            callback(err, null);
        }
        return result;
    });

    return result;
}


const router = express.Router();

router.get('/', (req, res) => {
    let result = query_select({});
    res.render('index', {contents: result});
});

router.get('/insert', (req,res) => {
    res.render('partials/insert');
});


router.post('/insert', (req,res) => {
    //the 32bit unique identifiers used by the system is done by unhex(replace(uuid(),'-',''))
    let body = req.body;
    
    for (let field in body) {
        if (body[field] == "") {
            body[field] = null;
        }
    }

    if (body["isvirtual"] == undefined){
        body.isvirtual = false;
    } else {
        body.isvirtual = true;
    }

    query_select(body, function(err, result)
    {
        console.log("Nasa labas na ako!");
        res.send(result);
    });
})

router.get('/find', (req,res) => {
    res.render('partials/find');
});

router.get('/update/:query', (req,res) => {
    let body = {};
    body.query = req.params.query;

    query_select(body, function(err, result)
    {
        console.log(result)
        res.render('partials/update', {contents: result});
    });
});

//TODO: add error handling
module.exports = router;