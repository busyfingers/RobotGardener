var database = require("../data/db");
var express = require('express');
//var util = require("util");
var router = express.Router();

router.get('/', function(req, res) {
    var responseText = "Everything is fine!";
    //util.log(responseText);
    res.status(200).send(responseText);
});

router.get('/errors', function(req, res) {
    
    
    // TODO: add function that picks the x latest errors from db
        
    res.json({ "errors": database.errors});
    
    res.status(200).send();

});

router.use(function (req, res, next) {
    var responseText = "Invalid API call: " + req.path; //`Invalid API call: ${req.path}`;
    res.status(403).send(responseText);
});

module.exports = router;