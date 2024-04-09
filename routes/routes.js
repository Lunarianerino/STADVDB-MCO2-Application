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
const AppointmentsController = require('../controllers/AppointmentsController.js');
const DashboardController = require('../controllers/DashboardController.js');
const DatabaseController = require('../controllers/DatabaseController.js');

// DatabaseController.connect(function() {
//     console.info('Connected to the Node: VISMIN')
// });

const router = express.Router();

router.get('/insert', DatabaseController.insert_partial);



router.get('/find', (req,res) => {
    res.render('partials/find');
});

router.get('/update/:query', DatabaseController.update_document);


/**
 * Appointments Routes
 */
router.get('/', AppointmentsController.getPage);

/**
 * Appointment Details Routes
 */
router.get('/details/:apptid', AppointmentsController.getDetails);

/**
 * Dashboard Routes
 */

router.get('/dashboard', DashboardController.getPage);



module.exports = router;