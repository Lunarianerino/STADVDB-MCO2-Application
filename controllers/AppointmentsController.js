const DatabaseController = require('./DatabaseController');
const api = require('../api/api.js');
const dotenv = require('dotenv');
const AppointmentsController = {
    getPage: (req, res) => {
        res.render('index');
    },

    getDetails: (req, res) => {
        // DatabaseController.query(0, function(err, result){
        //     if (err) {
        //         console.log(err);
        //     } else {
        //         res.render('index', {contents: result});
        //     }
        // });
        res.render('details', {contents: req.params});
    },

    getAddPage: (req, res) => {
        res.render('add');
    },
}

module.exports = AppointmentsController;