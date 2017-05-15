var expect = require("chai").expect;
var request = require("supertest");
var rewire = require('rewire');
var app = rewire("../app");
var sinon = require("sinon");
    
describe("API Tests", function () {
       
    describe("Base route", function () {
        beforeEach(function () {
            
            this.util = {
                log: sinon.spy()
            };
        
            app.__set__("database", this.database);
            app.__set__("util", this.util);
        });
        
        it("GET /", function (done) {
            
            var _this = this;
            
            request(app).get("/")
            .end(function(err, res) {
                expect(res.text).to.equal("/ is not a valid path/command");
                expect(res.statusCode).to.equal(403);
                done();
            });
        });
    
    });
    
    describe("Status routes", function () {
    
        it("GET /status", function (done) {        
            request(app).get("/status")
            .end(function(err, res) {
                expect(res.statusCode).to.equal(200);
                expect(res.text).to.equal("Everything is fine!");
                done();
            });
        });
        
        it("GET /status/errors", function (done) {        
            request(app).get("/status/errors")
            .end(function(err, res) {
                expect(res.statusCode).to.equal(200);
                expect(res.body).to.have.property('errors');
                done();
            });
        });
        
        it("GET /status/nd9873 (invalid route)", function (done) {        
            request(app).get("/status/nd9873")
            .end(function(err, res) {
                expect(res.statusCode).to.equal(403);
                expect(res.text).to.contain('Invalid API call');
                done();
            });
        });
    
    });
    
    describe("Command routes", function () {
        
        it("GET /command/on");
        
        it("GET /command/off");
        
        it("GET /command/on");
        
        it("GET /command/7asdnh (invalid route)");
        
    });
})
