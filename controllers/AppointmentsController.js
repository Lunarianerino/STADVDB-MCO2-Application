const DatabaseController = require('./DatabaseController');
const api = require('../api/api.js');

const AppointmentsController = {
    getPage: (req, res) => {
        DatabaseController.query(0, function(err, result){
            if (err) {
                console.log(err);
            } else {
                res.render('index', {contents: result});
            }
        });
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