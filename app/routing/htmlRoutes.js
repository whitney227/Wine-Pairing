var express = require('express');
var htmlRouter = express.Router();
var path = require("path");

// HTML GET Requests
htmlRouter.get('/', function(req, res) {
    res.sendFile("home.html", {root: path.join('./app/public')});
});
htmlRouter.get('/bio', function (req, res) {
    res.sendFile("bio.html", {root: path.join('./app/public')});
  });
  
  // If no matching route is found default to home
  htmlRouter.get("*", function(req, res) {
    res.sendFile("home.html", {root: path.join('./app/public')});
  });

module.exports = htmlRouter;