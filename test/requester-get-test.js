/* Copyright (c) 2017 e-soa Jacques Desodt, MIT License */
'use strict'

// Prerequisites
const testConfig = require('./config')
const requester = require('../requester')
const testFunctions = require('./functions')

// Test prerequisites
const Code = require('code')
const Lab = require('lab', {timeout: testFunctions.timeout})
const lab = (exports.lab = Lab.script())
const describe = lab.describe
const it = lab.it
const expect = Code.expect

const errMsg = 'ko'
// Mocks the requester
const requestCurrent = requester.request

describe('requester get', {timeout: testFunctions.timeout}, function () {
  //
  // Options
  it('no options object', function (fin) {
    const options = 'Oops!'
    requester.get(options, '')
    .catch(function (err) {
      expect(err.error.indexOf('bad options') > -1).to.equal(true)
      fin()
    })
  })
  //
  it('bad protocol', function (fin) {
    const options = { protocol: 123 }
    requester.get(options, '')
    .catch(function (err) {
      expect(err.error.indexOf('bad options') > -1).to.equal(true)
      fin()
    })
  })
  //
  it('bad host', function (fin) {
    const options = { protocol: 'http', host: 123 }
    requester.get(options, '')
    .catch(function (err) {
      expect(err.error.indexOf('bad options') > -1).to.equal(true)
      fin()
    })
  })
  // Get
  it('request error', function (fin) {
    // Mocks the requester
    requester.request = function (options) {
      return new Promise(function (resolve, reject) {
        return reject(new Error(errMsg))
      })
    }
    //
    requester.get(testConfig, '/')
    .catch(function (err) {
      requester.request = requestCurrent
      expect(err.message).to.equal(errMsg)
      fin()
    })
  })
  //
  it('request ok', function (fin) {
    // Mocks the requester
    requester.request = function (options) {
      return new Promise(function (resolve, reject) {
        return resolve({success: true})
      })
    }
    //
    requester.get(testConfig, '/')
    .then(function (result) {
      requester.request = requestCurrent
      expect(result.success).to.equal(true)
      fin()
    })
  })
  //
})
