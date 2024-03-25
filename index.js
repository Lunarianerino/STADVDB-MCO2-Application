/**
 * @file index.js is the root file for this application.
 * @description This file is the entry point for this application.
 * @requires express This is the framework used to build this application.
 * @requires dotenv This is used to load environment variables from a .env file.
 */

require('console-info');
require('console-error');
require('console-warn');
require('console-success');

/*
    3rd party libraries
*/
const express = require('express');
const dotenv = require('dotenv');
const ejs = require('ejs');
const bodyParser = require('body-parser');

/*
    Defined libraries
*/
const routes = require('./routes/routes.js');

/*
    Environment variables
*/
dotenv.config();
const PORT = process.env.PORT || 3000;
const HOSTNAME = process.env.HOSTNAME || 'localhost';

/*
    Express application
*/
const app = express();

/*
    Package.json
*/
const package = require('./package.json');

console.info(`Application: ${package.name}`);
console.info(`Version: ${package.version}`);

app.use(express.json());

app.set('view engine', 'ejs');
app.use (express.static(`public`));
app.use (bodyParser.urlencoded({encoded: false, extended: true}));

app.use('/', routes);
app.listen(PORT, function()
{
    console.info(`Server running at http://${HOSTNAME}:${PORT}`);
});
