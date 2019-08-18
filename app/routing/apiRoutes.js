var express = require('express');
var apiRouter = express.Router();

var wines = require("../data/wine.js");

// API GET Requests
// Reponds back with a JSON array of objects
apiRouter.get("/api/wines", function(req, res) {
    res.json(wines);
});

// API POST Request
apiRouter.post("/api/wines", function(req, res) {
    
    var bestMatch = {
        name: "",
        url: "",
        difference: Infinity
    };
    console.log(req.body);

    var userData = req.body;
    var userScores = userData.scores;

    console.log(userScores);
    var totDiff = 0;
    for(var i = 0; i < wines.length; i++){
        console.log(wines[i]);
        totDiff = 0;
        for(var j = 0; j < wines[i].scores[j]; j++){
            totDiff += Math.abs(parseInt(userScores[j])- parseInt(wines[i].scores[j]));
        }
        if(totDiff <= bestMatch.difference){
            bestMatch.name = wines[i].name
            bestMatch.url = wines[i].url
            bestMatch.difference = totDiff;
        }
    }
    // This returns the bestMatch wine object to the frontend in JSON format
    res.json(bestMatch)        
});

module.exports = apiRouter;
