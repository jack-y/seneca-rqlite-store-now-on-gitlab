/* Copyright (c) 2017 e-soa Jacques Desodt, MIT License */
'use strict'

// Prerequisites
const testConfig = require('./config')
const httpapi = require('../http-api')
const testFunctions = require('./functions')

// Test prerequisites
const Code = require('code')
const Lab = require('lab', {timeout: testFunctions.timeout})
var lab = (exports.lab = Lab.script())
var describe = lab.describe
var it = lab.it
var expect = Code.expect

describe('http api', function () {
  //
  // Execute transaction with bad array
  it('execute transaction bad array', function (fin) {
    httpapi.executeTransaction(testConfig, 'Ooops! I m not an array.')
    .catch(function (err) {
      expect(err).to.exist()
      fin()
    })
  })
  // Query HTTP with bad SQL
  it('query http bad sql', function (fin) {
    httpapi.query(testConfig, 'Ooops! I m not SQL.')
    .catch(function (err) {
      expect(err).to.exist()
      fin()
    })
  })
  // Query HTTPS with bad SQL
  it('query https bad sql', function (fin) {
    var oldProtocol = testConfig.protocol
    testConfig.protocol = 'https'
    httpapi.query(testConfig, 'Ooops! I m not SQL.')
    .catch(function (err) {
      testConfig.protocol = oldProtocol
      expect(err.error).to.exist()
      fin()
    })
  })
  // Gets values on an empty data
  it('get values no response', function (fin) {
    var oldProtocol = testConfig.protocol
    testConfig.protocol = 'http'
    httpapi.getValues({})
    .then(function (result) {
      testConfig.protocol = oldProtocol
      expect(result).to.exist()
      expect(result.length).to.equal(0)
      fin()
    })
  })
  //
  it('get error null', function (fin) {
    var result = httpapi.getError({})
    expect(result).to.not.exist()
    fin()
  })
  //
  it('get error string', function (fin) {
    var msg = 'So bad...'
    var result = {
      results: [
        { error: msg }
      ]
    }
    var getResult = httpapi.getError(result)
    expect(getResult).to.equal(msg)
    fin()
  })
  //
})
