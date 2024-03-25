const express = require('express');
const mysql = require('mysql');
//const web = require("../controllers/web.controller.js")

var con = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'aristeo0',
    database: 'mco2database_vismin'
});

con.connect(function(err){
    if(err) throw err;
    console.info("Connection Successful!");
});

const router = express.Router();

router.get('/', (req, res) => {
    res.redirect('/insert');
   //res.redirect("/en/intro");
});
router.get('/insert', (req,res) => {
    res.render('insert');
});

router.post('/insert', (req,res) => {
    //the 32bit unique identifiers used by the system is done by unhex(replace(uuid(),'-',''))
    let body = req.body;
    body.aptid = apptid
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
    var sql = `INSERT INTO appointments VALUES (UUID(), "Queued", NOW(), ${body.queuedate}, NULL, NULL, ${body.type}, NULL, NULL, "Mindanao", NULL, NULL, NULL)`;
    console.info(sql);
    con.query(sql, function(err, result) {
        if(err) throw err;
        res.send(result);
    })
    res.send(body)
})

//TODO: add error handling
module.exports = router;