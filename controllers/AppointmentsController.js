const DatabaseController = require('./DatabaseController');

const AppointmentsController = {
    getPage: (req, res) => {
        DatabaseController.query(0, function(err, result){
            if (err) {
                console.log(err);
            } else {
                res.render('index', {contents: result});
            }
        });
    }
}

module.exports = AppointmentsController;