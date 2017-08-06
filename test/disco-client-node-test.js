/* Copyright (c) 2017 e-soa Jacques Desodt, MIT License */
'use strict'

// Prerequisites
const discoclient = require('../disco-client')
const events = require('events')
const testFunctions = require('./functions')

// Test prerequisites
const Code = require('code')
const Lab = require('lab', {timeout: testFunctions.timeout})
const lab = (exports.lab = Lab.script())
const describe = lab.describe
const it = lab.it
const expect = Code.expect

const errMsg = 'ko'
// Mocks the module
const processResponseCurrent = discoclient.processResponse

// Mocks HTTP req and res
var response = new events.EventEmitter()
response.setEncoding = function (e) {}

describe('discovery client node', {timeout: testFunctions.timeout}, function () {
  //
  // Query first node
  it('request on first node: http one node error 404', function (fin) {
    const options = {
      protocol: 'http',
      host: 'localhost',
      port: 4001,
      timeout: 1000,
      postData: ''
    }
    const nodes = ['localhost:9999'] // Cannot be reached
    discoclient.requestFirstNode(options, nodes)
    .catch(function (err) {
      expect(err.error.indexOf('no more nodes') > -1).to.equal(true)
      fin()
    })
  })
  // Query first node
  it('request on first node: https one node error 404', function (fin) {
    const options = {
      protocol: 'https',
      host: 'localhost',
      port: 4001,
      timeout: 1000,
      postData: ''
    }
    const nodes = ['www.google.com:9999'] // Cannot be reached
    discoclient.requestFirstNode(options, nodes)
    .catch(function (err) {
      expect(err.error.indexOf('no more nodes') > -1).to.equal(true)
      fin()
    })
  })
  //
  it('request on first node: one node timeout', function (fin) {
    const options = {
      protocol: 'http',
      host: 'localhost',
      port: 4001,
      timeout: 100,
      method: 'GET',
      path: '/200?sleep=500',
      postData: ''
    }
    const nodes = ['httpstat.us:80'] // Timeout from the options path
    discoclient.requestFirstNode(options, nodes)
    .catch(function (err) {
      expect(err.error.indexOf('no more nodes') > -1).to.equal(true)
      fin()
    })
  })
  //
  it('request on first node: one node ok', function (fin) {
    // Mocks the response process
    discoclient.processResponse = function (options, response) {
      return new Promise(function (resolve, reject) {
        return resolve({success: true})
      })
    }
    //
    const options = {
      protocol: 'http',
      host: 'localhost',
      port: 4001,
      timeout: 4000,
      method: 'GET',
      path: '/200',
      postData: ''
    }
    const nodes = ['httpstat.us:80']
    discoclient.requestFirstNode(options, nodes)
    .then(function (result) {
      discoclient.processResponse = processResponseCurrent
      expect(result.success).to.equal(true)
      fin()
    })
  })
  //
  it('request on first node: processResponse on error', function (fin) {
    // Mocks the response process
    discoclient.processResponse = function (options, response) {
      return new Promise(function (resolve, reject) {
        return reject({error: new Error(errMsg)})
      })
    }
    //
    const options = {
      protocol: 'http',
      host: 'localhost',
      port: 4001,
      timeout: 4000,
      method: 'GET',
      path: '/200',
      postData: ''
    }
    const nodes = ['httpstat.us:80']
    discoclient.requestFirstNode(options, nodes)
    .catch(function (err) {
      discoclient.processResponse = processResponseCurrent
      expect(err.error.message).to.equal(errMsg)
      fin()
    })
  })
  //
  it('request on first node: two nodes: first error, second error', function (fin) {
    const options = {
      protocol: 'http',
      host: 'localhost',
      port: 4001,
      timeout: 2000,
      postData: ''
    }
    const nodes = ['localhost:9998', 'localhost:9999']
    discoclient.requestFirstNode(options, nodes)
    .catch(function (err) {
      expect(err.error.indexOf('no more nodes') > -1).to.equal(true)
      fin()
    })
  })
  //
  it('request on first node: two nodes: first timeout, second error', function (fin) {
    const options = {
      protocol: 'http',
      host: 'localhost',
      port: 4001,
      timeout: 100,
      method: 'GET',
      path: '/200?sleep=500',
      postData: ''
    }
    const nodes = ['httpstat.us:80', 'localhost:9999']
    discoclient.requestFirstNode(options, nodes)
    .catch(function (err) {
      expect(err.error.indexOf('no more nodes') > -1).to.equal(true)
      fin()
    })
  })
  //
  it('request on first node: two nodes: first error, second timeout', function (fin) {
    const options = {
      protocol: 'http',
      host: 'localhost',
      port: 4001,
      timeout: 100,
      method: 'GET',
      path: '/200?sleep=500',
      postData: ''
    }
    const nodes = ['localhost:9999', 'httpstat.us:80']
    discoclient.requestFirstNode(options, nodes)
    .catch(function (err) {
      expect(err.error.indexOf('no more nodes') > -1).to.equal(true)
      fin()
    })
  })
  //
  it('request on first node: two nodes: first timeout, second ok', function (fin) {
    // Mocks the response process
    discoclient.processResponse = function (options, response) {
      return new Promise(function (resolve, reject) {
        return resolve({success: true})
      })
    }
    //
    const options = {
      protocol: 'http',
      host: 'localhost',
      port: 4001,
      timeout: 400,
      method: 'GET',
      path: '/200?sleep=500',
      postData: ''
    }
    const nodes = ['httpstat.us:80', 'www.google.com:80']
    discoclient.requestFirstNode(options, nodes)
    .then(function (result) {
      discoclient.processResponse = processResponseCurrent
      expect(result.success).to.equal(true)
      fin()
    })
  })
  //
  it('request on first node: two nodes: first error, second ok', function (fin) {
    // Mocks the response process
    discoclient.processResponse = function (options, response) {
      return new Promise(function (resolve, reject) {
        return resolve({success: true})
      })
    }
    const options = {
      protocol: 'http',
      host: 'localhost',
      port: 4001,
      timeout: 2000,
      method: 'GET',
      path: '/200',
      postData: ''
    }
    const nodes = ['localhost:9999', 'httpstat.us:80']
    discoclient.requestFirstNode(options, nodes)
    .then(function (result) {
      discoclient.processResponse = processResponseCurrent
      expect(result.success).to.equal(true)
      fin()
    })
  })
  // Process node response
  it('process response: http error', function (fin) {
    response.statusCode = 300
    const options = {
      timeout: 4000
    }
    discoclient.processResponse(options, response)
    .catch(function (err) {
      expect(err.status).to.equal(response.statusCode)
      expect(err.error.indexOf('node request on error') > -1).to.equal(true)
      fin()
    })
  })
  //
  it('process response: data is not json', function (fin) {
    response.statusCode = 200
    const options = {
      timeout: 4000
    }
    discoclient.processResponse(options, response)
    .then(function (result) {
      expect(result.data).to.equal({})
      fin()
    })
    response.emit('data', 'This is not JSON')
    response.emit('end')
  })
  //
  it('process response: data ok', function (fin) {
    response.statusCode = 200
    const options = {
      timeout: 4000
    }
    discoclient.processResponse(options, response)
    .then(function (result) {
      expect(result.data.foo).to.equal('bar')
      fin()
    })
    response.emit('data', '{"foo":"bar"}')
    response.emit('end')
  })
  //
})
