const express = require('express');
const mysql = require('mysql');
//const web = require("../controllers/web.controller.js")

// var con = mysql.createConnection({
//     host: '192.168.68.108',
//     user: 'luis',
//     password: 'aristeo0',
//     database: 'mco2database_vismin'
// });

/**
 * Controllers
 */

const api = require('../api/api.js');

api.connect(function() {
    console.info(`Connected to the database`);
});
const router = express.Router();

router.get('/status', api.status);

router.get('/find', api.find);

router.get('/checkNodes', api.checkNodes);

router.get('/update', api.update);

router.get('/delete', api.delete);



//TODO: add error handling
module.exports = router;