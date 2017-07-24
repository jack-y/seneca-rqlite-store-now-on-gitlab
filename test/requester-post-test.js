/* Copyright (c) 2017 e-soa Jacques Desodt, MIT License */
'use strict'

// Prerequisites
const testConfig = require('./config')
const requester = require('../requester')
const testFunctions = require('./functions')

// Test prerequisites
const Code = require('code')
const Lab = require('lab', {timeout: testFunctions.timeout})
var lab = (exports.lab = Lab.script())
var describe = lab.describe
var it = lab.it
var expect = Code.expect

describe('requester post', function () {
  //
  // HTTPS result
  it('https', function (fin) {
    var options = {
      protocol: 'https',
      host: 'www.qwant.com',
      port: 443
    }
    requester.post(options, '/', {})
    .then(function (result) {
      expect(result.data).to.exist()
      fin()
    })
  })
  // HTTPS request error
  it('https error', function (fin) {
    var options = {
      protocol: 'https',
      host: 'e-soa.com',
      port: 443
    }
    requester.post(options, '/', {})
    .catch(function (err) {
      expect(err).to.exist()
      fin()
    })
  })
  // HTTP error on options
  it('http error', function (fin) {
    var options = {
      protocol: 'http',
      host: '',
      port: 0
    }
    requester.post(options, '', {})
    .catch(function (err) {
      expect(err).to.exist()
      fin()
    })
  })
  // Request on the leader
  it('leader', function (fin) {
    // Checks if this is not a Travis Build environment
    // There is no cluster in the Travis Build environment
    if (!process.env.TEST_ENV || process.env.TEST_ENV !== 'travis') {
      var oldOption = testConfig.host
      testConfig.host = testConfig.leader
      var data = ['select count(*) from sqlite_master']
      requester.post(testConfig, '/db/execute', data)
      .then(function (result) {
        testConfig.host = oldOption
        expect(result.data.results[0]).to.exist()
        fin()
      })
    } else {
      // Running in Travis Build environment: no cluster, so no test
      fin()
    }
  })
  // Redirection to the leader
  it('redirect', function (fin) {
    // Checks if this is not a Travis Build environment
    // There is no cluster in the Travis Build environment
    if (!process.env.TEST_ENV || process.env.TEST_ENV !== 'travis') {
      var data = ['select count(*) from sqlite_master']
      requester.post(testConfig, '/db/execute', data)
      .then(function (result) {
        expect(result.data.results[0]).to.exist()
        fin()
      })
    } else {
      // Running in Travis Build environment: no cluster, so no test
      fin()
    }
  })
  // Maximumu number of redirections reached
  it('max redirect reached', function (fin) {
    // Checks if this is not a Travis Build environment
    // There is no cluster in the Travis Build environment
    if (!process.env.TEST_ENV || process.env.TEST_ENV !== 'travis') {
      testConfig.redirects = testConfig.maxredirects
      var data = ['select count(*) from sqlite_master']
      requester.post(testConfig, '/db/execute', data)
      .catch(function (err) {
        delete testConfig.redirects
        expect(err.error).to.exist()
        fin()
      })
    } else {
      // Running in Travis Build environment: no cluster, so no test
      fin()
    }
  })
  // No options object
  it('no options object', function (fin) {
    var options = 'Oops!'
    requester.post(options, '', {})
    .catch(function (err) {
      expect(err.error).to.exist()
      fin()
    })
  })
  // Bad protocol
  it('bad protocol', function (fin) {
    var options = { protocol: 123 }
    requester.post(options, '', {})
    .catch(function (err) {
      expect(err.error).to.exist()
      fin()
    })
  })
  // Bad host
  it('bad host', function (fin) {
    var options = { protocol: 'http', host: 123 }
    requester.post(options, '', {})
    .catch(function (err) {
      expect(err.error).to.exist()
      fin()
    })
  })
  //
})
