var  wines = require("../data/wine");

module.exports = function (app) {

    app.get("/api/wines", function(req, res) {
        res.json(wines);
    });

    app.post("/api/wines", function(req, res) {
        
        var userData = req.body;
     
        var bestMatch = {
            name: "",
            url: "",
            difference: Infinity
        }

        for(var i = 0; i < wines.length; i++){
            var totDiff = 0;
            for(var j = 0; j < wines[i].scores.length; j++){
                totDiff += Math.abs(parseInt(wines[i].scores[j]) - parseInt(userData.scores[j]))
            }
            if(totDiff < bestMatch.difference){
                bestMatch.name = wines[i].name
                bestMatch.url = wines[i].url
                bestMatch.difference = totDiff
            }
        }

        wines.push(userData)
        res.json(bestMatch)
           
    });

}