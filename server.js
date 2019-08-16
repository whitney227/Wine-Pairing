// Dependencies
var express = require('express');
var bodyParser = require('body-parser');
var htmlRoutes = require('./app/routing/htmlRoutes');
var apiRoutes = require('./app/routing/apiRoutes');

// Set up Express App
var app = express()
var PORT = process.env.PORT || 8080;

// Sets up the Express App to handle data parsing
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// Static routing
app.use(express.static(__dirname + "/app/public/"));

// Routes for API and HTML
app.use('/', apiRoutes);
app.use('/', htmlRoutes);

// Catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error ('Uh oh! Something went wrong...');
    err.status = 404;
    next(err);
})

// Starts the server to listen PORT 8080
app.listen(PORT, function() {
    console.log("App listening on PORT " + PORT + ". Point your browser to: http://localhost:"+ PORT);
});