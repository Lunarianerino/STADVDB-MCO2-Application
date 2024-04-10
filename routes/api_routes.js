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

const router = express.Router();

router.get('/status', api.status);

router.get('/find', api.find);

router.get('/checkNodes', api.checkNodes);

router.get('/update', api.update);

router.get('/delete', api.delete);

router.get('/insert', api.insert);

router.get('/getappt/:apptid', api.getappt);

router.get('/getlogs', api.getlogs);

router.get('/whereAmI', api.whereAmI);

router.get('/getdashboard', api.getdashboard);

//TODO: add error handling
module.exports = router;