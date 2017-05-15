var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');

const DB_PORT_NUM = 1337;
const DB_URL = "mongodb://localhost:" + DB_PORT_NUM + "/local";

var insertDocument = function(db, data, callback) {
   db.collection('gardener_sensor_data').insertOne(data, function(err, result) {
        if (err) { return util.log("Insert DB document failed: %s", err); }
        callback();
    });
};

var saveToDB = function(dataDocument) {
    getDBConnection(function(db) {
        insertDocument(db, dataDocument, function() {
            db.close();
        });
    });
};

var getLatestTemperature = function(callback) {
    getDBConnection(function(db) {
        var results = db.collection('gardener_sensor_data').find({ sensor: 'temp' }).sort({_id:-1}).limit(1)
        .toArray(function(err, docs) {
            db.close();
            callback({ "temperature": docs[0]["value"], "timestamp": docs[0]["time"] });
        });
    });
};

var getDataFromTimePeriod = function(timeunit, interval, callback) {
    getDBConnection(function(db) {
        var results = db.collection('gardener_sensor_data').find({ time: { $gt: (new Date(Date().now-7*24*60*60*1000)) }})
        .toArray(function(err, docs) {
            db.close();
            callback(docs);
        });
    });
}

var getDBConnection = function(callback) {
    MongoClient.connect(DB_URL, function(err, db) {
        if (err) { return util.log("Failed to connect to DB: %s", err); }
        callback(db);
    });
};

var getTimeStamp = function() {
    var d = new Date();
    var time = d.getTime()-d.getTimezoneOffset()*60000; // offset in minutes, convert to milliseconds
    var datestr = new Date(time);
    return datestr;
};

module.exports.insertDocument = insertDocument;
module.exports.saveToDB = saveToDB;
module.exports.getLatestTemperature = getLatestTemperature;
module.exports.getTimeStamp = getTimeStamp;
module.exports.getDataFromTimePeriod = getDataFromTimePeriod;

/*
// TODO: finish this
var plotData = function(xVal, yVal, fileName) {
    var data = [ {
        x: xVal,
        y: yVal
        //, stream:{token:token, maxpoints: 500} 
    } ];

    var graphOpts = {fileopt : "extend", filename : "fileName-test"};

    plotly.plot(data, graphOpts, function (err, msg) {
        if (err) return console.log(err);
        //console.log(msg);
    });
}
*/