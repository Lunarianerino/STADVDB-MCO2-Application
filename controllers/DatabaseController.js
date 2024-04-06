const mysql = require('mysql');

module.exports = {
    con: mysql.createConnection({
        host: '172.27.174.136',
        user: 'ostin',
        password: 'password',
        database: 'mco2database_vismin'
    }),
    connect: function(callback) {
        this.con.connect(function(err) {
            if (err) throw err;
            callback();
        });
    },
    query: function(offset, callback) {
        offset = offset || 0;
        offset = offset * 10;
        this.con.query(`SELECT * FROM appointments LIMIT ${offset},10`, function(err, result, fields) {
            if (err) {
                return callback(err, null);
            }
            return callback(null, result);
        });
    },
    insert_partial: function(req, res) {
        res.render('partials/insert');
    },
    update_document: function(req, res) {
        let body = {};
        body.query = req.params.query;
    
        query_select(body, function(err, result)
        {
            console.log(result)
            res.render('partials/update', {contents: result});
        });
    }
};

/**
 * Deprecated Functions:
 */
// router.post('/insert', (req,res) => {
//     //the 32bit unique identifiers used by the system is done by unhex(replace(uuid(),'-',''))
//     let body = req.body;
    
//     for (let field in body) {
//         if (body[field] == "") {
//             body[field] = null;
//         }
//     }

//     if (body["isvirtual"] == undefined){
//         body.isvirtual = false;
//     } else {
//         body.isvirtual = true;
//     }

//     query_select(body, function(err, result)
//     {
//         console.log("Nasa labas na ako!");
//         res.send(result);
//     });
// })


