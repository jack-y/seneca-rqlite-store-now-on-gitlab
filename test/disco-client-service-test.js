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
const processNodesCurrent = discoclient.processNodes
const processResponseNodesCurrent = discoclient.processResponseNodes
const requestFirstNodeCurrent = discoclient.requestFirstNode

// Mocks the HTTP response
var response = new events.EventEmitter()
response.setEncoding = function (e) {}

describe('discovery client service', {timeout: testFunctions.timeout}, function () {
  //
  // HTTP request on Discovery Service
  it('request Discovery Service: hhtp error 404', function (fin) {
    const options = {
      disco_url: 'http://httpstat.us/404',
      timeout: 4000
    }
    discoclient.request(options)
    .catch(function (err) {
      expect(err.status).to.equal(404)
      fin()
    })
  })
  //
  it('request Discovery Service: https error 404', function (fin) {
    const options = {
      disco_url: 'https://www.google.com/bad/path',
      timeout: 2000
    }
    discoclient.request(options)
    .catch(function (err) {
      expect(err.status).to.equal(404)
      fin()
    })
  })
  //
  it('request Discovery Service: error timeout', function (fin) {
    const options = {
      disco_url: 'http://httpstat.us/200?sleep=400',
      timeout: 200
    }
    discoclient.request(options)
    .catch(function (err) {
      expect(err.error.message.indexOf('socket hang up') > -1).to.equal(true)
      fin()
    })
  })
  //
  it('request Discovery Service: OK', function (fin) {
    const options = {
      disco_url: 'http://httpstat.us/200',
      timeout: 4000
    }
    // Mocks the process response
    discoclient.processResponseNodes = function (options, response) {
      return new Promise(function (resolve, reject) {
        return resolve({success: true})
      })
    }
    // Requests with return ok
    discoclient.request(options)
    .then(function (result) {
      discoclient.processResponseNodes = processResponseNodesCurrent
      expect(result.success).to.equal(true)
      fin()
    })
  })
  // Process Discovery Service response
  it('Discovery Service response: http error', function (fin) {
    response.statusCode = 300
    const options = {
      disco_url: 'http://httpstat.us/200',
      timeout: 4000
    }
    discoclient.processResponseNodes(options, response)
    .catch(function (err) {
      expect(err.status).to.equal(response.statusCode)
      expect(err.error.indexOf('Cannot request') > -1).to.equal(true)
      fin()
    })
  })
  //
  it('Discovery Service response: invalid json', function (fin) {
    response.statusCode = 200
    const options = {
      disco_url: 'http://httpstat.us/200',
      timeout: 4000
    }
    discoclient.processResponseNodes(options, response)
    .catch(function (err) {
      expect(err.error.indexOf('invalid JSON') > -1).to.equal(true)
      fin()
    })
    response.emit('data', 'This is not JSON')
    response.emit('end')
  })
  //
  it('Discovery Service response: no array', function (fin) {
    response.statusCode = 200
    const options = {
      disco_url: 'http://httpstat.us/200',
      timeout: 4000
    }
    discoclient.processResponseNodes(options, response)
    .catch(function (err) {
      expect(err.error.indexOf('invalid nodes array') > -1).to.equal(true)
      expect(err.nodes).to.not.exist()
      fin()
    })
    response.emit('data', '{"foo":"bar"}')
    response.emit('end')
  })
  //
  it('Discovery Service response: bad array items', function (fin) {
    response.statusCode = 200
    const options = {
      disco_url: 'http://httpstat.us/200',
      timeout: 4000
    }
    discoclient.processResponseNodes(options, response)
    .catch(function (err) {
      expect(err.error.indexOf('invalid nodes array') > -1).to.equal(true)
      expect(err.nodes.length).to.equal(2)
      fin()
    })
    response.emit('data', '{"nodes":[123,"abc"]}')
    response.emit('end')
  })
  //
  it('Discovery Service response: processNodes error', function (fin) {
    // Mocks the nodes process
    discoclient.processNodes = function (options, nodes) {
      return new Promise(function (resolve, reject) {
        return reject({error: new Error(errMsg)})
      })
    }
    //
    response.statusCode = 200
    const options = {
      disco_url: 'http://httpstat.us/200',
      timeout: 4000
    }
    discoclient.processResponseNodes(options, response)
    .catch(function (err) {
      discoclient.processNodes = processNodesCurrent
      expect(err.error.message).to.equal(errMsg)
      fin()
    })
    response.emit('data', '{"nodes":["1","2","3"]}')
    response.emit('end')
  })
  //
  it('Discovery Service response: OK', function (fin) {
    // Mocks the nodes process
    discoclient.processNodes = function (options, nodes) {
      return new Promise(function (resolve, reject) {
        return resolve({success: true})
      })
    }
    //
    response.statusCode = 200
    const options = {
      disco_url: 'http://httpstat.us/200',
      timeout: 4000
    }
    discoclient.processResponseNodes(options, response)
    .then(function (result) {
      discoclient.processNodes = processNodesCurrent
      expect(result.success).to.equal(true)
      fin()
    })
    response.emit('data', '{"nodes":["1","2","3"]}')
    response.emit('end')
  })
  // Process the nodes array
  it('process nodes array: empty', function (fin) {
    const options = {
      host: 'localhost',
      port: 4001
    }
    discoclient.processNodes(options, [])
    .catch(function (err) {
      expect(err.error.indexOf('no more nodes') > -1).to.equal(true)
      fin()
    })
  })
  //
  it('process nodes array: current node', function (fin) {
    const options = {
      host: 'localhost',
      port: 4001
    }
    discoclient.processNodes(options, [options.host + ':' + options.port])
    .catch(function (err) {
      expect(err.error.indexOf('no more nodes') > -1).to.equal(true)
      fin()
    })
  })
  //
  it('process nodes array: another node', function (fin) {
    // Mocks the first node process
    discoclient.requestFirstNode = function (options, nodes) {
      return new Promise(function (resolve, reject) {
        return resolve({success: true})
      })
    }
    //
    const options = {
      host: 'localhost',
      port: 4001
    }
    const node = 'myhost:80'
    discoclient.processNodes(options, [node, options.host + ':' + options.port])
    .then(function (result) {
      discoclient.requestFirstNode = requestFirstNodeCurrent
      expect(result.success).to.equal(true)
      fin()
    })
  })
  //
})
