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

describe('requester get', function () {
  //
  // HTTPS request
  it('https result', function (fin) {
    var options = {
      protocol: 'https',
      host: 'e-soa.com',
      port: 443
    }
    requester.get(options, '/')
    .then(function (result) {
      expect(result).to.exist()
      fin()
    })
  })
  // HTTPS request error
  it('https error', function (fin) {
    var options = {
      protocol: 'https',
      host: 'www.google.com',
      port: 443
    }
    requester.get(options, '/jobijoba')
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
    requester.get(options, '')
    .catch(function (err) {
      expect(err).to.exist()
      fin()
    })
  })
  // Request on the leader
  it('leader', function (fin) {
    var oldOption = testConfig.host
    testConfig.host = testConfig.leader
    requester.get(testConfig, '/db/query?q=select%20*%20from%20sqlite_master')
    .then(function (result) {
      testConfig.host = oldOption
      expect(result.data.results[0].values).to.exist()
      fin()
    })
  })
  // Redirection to the leader
  it('redirect', function (fin) {
    requester.get(testConfig, '/db/query?q=select%20*%20from%20sqlite_master')
    .then(function (result) {
      expect(result.data.results[0].values).to.exist()
      fin()
    })
  })
  // Maximumu number of redirections reached
  it('max redirect reached', function (fin) {
    testConfig.redirects = testConfig.maxredirects
    requester.get(testConfig, '/db/query?q=select%20*%20from%20sqlite_master')
    .catch(function (err) {
      delete testConfig.redirects
      expect(err.error).to.exist()
      fin()
    })
  })
  // No options object
  it('no options object', function (fin) {
    var options = 'Oops!'
    requester.get(options, '')
    .catch(function (err) {
      expect(err.error).to.exist()
      fin()
    })
  })
  // Bad protocol
  it('bad protocol', function (fin) {
    var options = { protocol: 123 }
    requester.get(options, '')
    .catch(function (err) {
      expect(err.error).to.exist()
      fin()
    })
  })
  // Bad host
  it('bad host', function (fin) {
    var options = { protocol: 'http', host: 123 }
    requester.get(options, '')
    .catch(function (err) {
      expect(err.error).to.exist()
      fin()
    })
  })
  // RQLite status
  it('status', function (fin) {
    requester.get(testConfig, '/status')
    .then(function (result) {
      expect(result.data.store.leader).to.exist()
      fin()
    })
    .catch(function (err) {
      console.log('err', err)
      expect(err).to.exist()
      fin()
    })
  })
  //
})
