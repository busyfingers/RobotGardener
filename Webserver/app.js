//var database = require("./data/db");
var serialport = require('serialport');
var portName = "";
//var plotly = require('plotly')('busyfingers','')
var token = '';
var express = require("express");
var util = require("util");
var app = express();
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var statusRoutes = require("./routes/status");
var commandRoutes = require("./routes/command");
var services = require("./services");

var startTime = new Date().getTime();
var endTime;
var lightIntensities = [];
var temperatures = [];

const DB_PORT_NUM = 1337;
const DB_URL = "mongodb://localhost:" + DB_PORT_NUM + "/local";
const PORT_NUM = 3000;
const line = "============================";
const SAVE_INTERVAL = 60000; // in ms
const PHOTO_SENSOR = "photo";
const TEMP_SENSOR = "temp";

var portArg = process.argv[2]; // e.g. tty.usbmodem1411
if (!portArg) {
    return util.log("Need to provide a port for arduino");
}
portName = '/dev/' + portArg;

var sp = new serialport(portName, {
    baudRate: 9600,
    dataBits: 8,
    parity: 'none',
    stopBits: 1,
    flowControl: false,
    parser: serialport.parsers.readline("\n")
}, function (err) {
    if (err) {
        return util.log("Failed to connect to Arduino on serial port: %s", err);
    }
});

var getSum = function(total, num) {
    return total + num;
}

var getAvg = function(numbersArray) {
    return numbersArray.reduce(getSum) / numbersArray.length;
}

var checkThreshold = function() {
    if (endTime-startTime >= SAVE_INTERVAL) {
        startTime = new Date().getTime();
        return true;
    } else {
        return false;
    }
}

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use('/status', statusRoutes);
app.use('/command', commandRoutes);

app.use('/favicon.ico', function (req, res) {
    res.writeHead(200, {'Content-Type': 'image/x-icon'} );
    res.end();
    return;
});

app.use(function(req, res, next) {
    var responseText = req.path + " is not a valid path/command" //`${req.path} is not a valid path/command`;
    res.status(403).send(responseText);
});

app.listen(PORT_NUM);

sp.on('data', function(input) {
    try {
        endTime = new Date().getTime();
        input = JSON.parse(input);
        var sensor = input.sensor;
        var value = input.value;

        switch (sensor) {
            case PHOTO_SENSOR:
                lightIntensities.push(value);
                break;

            case TEMP_SENSOR:
                temperatures.push(value);
                break;
        
            default:
                util.log("Invalid sensor: %s, with value: %s", sensor, value); //(`Invalid sensor: ${sensor}, with value: ${value}`);
                break;
        }

        if (checkThreshold()) {
            var timepoint = services.getTimeStamp();
            var avgTemp = getAvg(temperatures);
            var avgLight = getAvg(lightIntensities);

            var tempDataDocument = {
                sensor: TEMP_SENSOR,
                time: timepoint,
                value: avgTemp
            };

            var lightDataDocument = {
                sensor: PHOTO_SENSOR,
                time: timepoint,
                value: avgLight
            };

            services.saveToDB(tempDataDocument);
            services.saveToDB(lightDataDocument);

            util.log("Temperature avg over %s ms: %s", SAVE_INTERVAL, avgTemp); //(`Temperature avg over ${SAVE_INTERVAL} ms: ${avgTemp}`);
            temperatures = [];
            util.log("Photo intensity avg over %s ms: %s", SAVE_INTERVAL, avgLight);//(`Photo instensity avg over ${SAVE_INTERVAL} ms: ${avgLight}`);
            lightIntensities = [];
        }
    } catch (err) {
        util.log("Error on receiving Arduino data: %s", err); //(`Error on receiving Arduino data: ${err}`);
    }
});

util.log(line);
util.log("Up and running on port %s!", PORT_NUM);//(`Up and running on port ${PORT_NUM}!`);
util.log(line);

module.exports = app;