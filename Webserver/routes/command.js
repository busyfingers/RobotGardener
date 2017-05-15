var express = require('express');
var util = require("util");
var router = express.Router();
var services = require("./../services");

router.get('/on', function(req, res) {
    var responseText = "Command sent: on";
    res.send(responseText);
    util.log(responseText);
});

router.get('/off', function(req, res) {
    var responseText = "Command sent: on";
    res.send(responseText);
    util.log(responseText);
});

router.get('/threshold/:value', function(req, res) {
    var responseText = "Command send: threshold, value: " + req.params.value; //`Command sent: threshold, value: ${req.params.value}`;
    res.send(responseText);
    util.log(responseText);
});

router.get('/temperature/current', function(req, res) {
    services.getLatestTemperature(function(tData) {
        var responseText = "Command sent: /temperature/current, value: " + tData.temperature;
        util.log(responseText);
        res.send(tData);
    });
});

router.get('/temperature/period', function(req, res) {
    services.getDataFromTimePeriod('', '', function(results) {
        var responseText = "Command sent: /temperature/period";
        util.log(results);
        res.send(results);
    });
});

router.use(function (req, res, next) {
    var responseText = "Invalid API call: " + req.path; //`Invalid API call: ${req.path}`;
    res.status(403).send(responseText);
});

module.exports = router;