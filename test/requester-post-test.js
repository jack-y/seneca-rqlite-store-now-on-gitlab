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

describe('requester post', {timeout: testFunctions.timeout}, function () {
  //
  // No options object
  it('no options object', function (fin) {
    const options = 'Oops!'
    requester.post(options, '', {})
    .catch(function (err) {
      expect(err.error.indexOf('bad options') > -1).to.equal(true)
      fin()
    })
  })
  // Bad protocol
  it('bad protocol', function (fin) {
    const options = { protocol: 123 }
    requester.post(options, '', {})
    .catch(function (err) {
      expect(err.error.indexOf('bad options') > -1).to.equal(true)
      fin()
    })
  })
  // Bad host
  it('bad host', function (fin) {
    const options = { protocol: 'http', host: 123 }
    requester.post(options, '', {})
    .catch(function (err) {
      expect(err.error.indexOf('bad options') > -1).to.equal(true)
      fin()
    })
  })
  // Post
  it('request error', function (fin) {
    // Mocks the requester
    requester.request = function (options) {
      return new Promise(function (resolve, reject) {
        return reject(new Error(errMsg))
      })
    }
    //
    requester.post(testConfig, '/', {})
    .catch(function (err) {
      requester.request = requestCurrent
      expect(err.message).to.equal(errMsg)
      fin()
    })
  })
  //
  it('request ok no data', function (fin) {
    // Mocks the requester
    requester.request = function (options) {
      return new Promise(function (resolve, reject) {
        return resolve({success: true})
      })
    }
    //
    requester.post(testConfig, '/', null)
    .then(function (result) {
      requester.request = requestCurrent
      expect(result.success).to.equal(true)
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
    requester.post(testConfig, '/', {})
    .then(function (result) {
      requester.request = requestCurrent
      expect(result.success).to.equal(true)
      fin()
    })
  })
  //
})
