/* Copyright (c) 2017 e-soa Jacques Desodt, MIT License */
'use strict'

// Prerequisites
const httpapi = require('../http-api')
const requester = require('../requester')
const testConfig = require('./config')
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
const postCurrent = requester.post
const getCurrent = requester.get

describe('http api', {timeout: testFunctions.timeout}, function () {
  //
  // Execute
  it('execute: error', function (fin) {
    // Mocks the requester
    requester.post = function (options, path, data) {
      return new Promise(function (resolve, reject) {
        return reject(new Error(errMsg))
      })
    }
    //
    httpapi.execute(testConfig, 'foo')
    .catch(function (err) {
      requester.post = postCurrent
      expect(err.message).to.equal(errMsg)
      fin()
    })
  })
  //
  it('execute: result', function (fin) {
    // Mocks the requester
    requester.post = function (options, path, data) {
      return new Promise(function (resolve, reject) {
        return resolve({ data: { results: [{foo: 'bar'}] } })
      })
    }
    //
    httpapi.execute(testConfig, 'foo')
    .then(function (result) {
      requester.post = postCurrent
      expect(result.success).to.equal(true)
      fin()
    })
  })
  // Execute transaction
  it('execute transaction: error', function (fin) {
    // Mocks the requester
    requester.post = function (options, path, data) {
      return new Promise(function (resolve, reject) {
        return reject(new Error(errMsg))
      })
    }
    //
    httpapi.executeTransaction(testConfig, ['foo'])
    .catch(function (err) {
      requester.post = postCurrent
      expect(err.message).to.equal(errMsg)
      fin()
    })
  })
  //
  it('execute transaction: result error', function (fin) {
    // Mocks the requester
    requester.post = function (options, path, data) {
      return new Promise(function (resolve, reject) {
        return resolve({ data: { results: [{error: errMsg}] } })
      })
    }
    //
    const transaction = ['foo']
    httpapi.executeTransaction(testConfig, transaction)
    .catch(function (err) {
      requester.post = postCurrent
      expect(err.error).to.equal(errMsg)
      expect(err.transaction).to.equal(transaction)
      fin()
    })
  })
  //
  it('execute transaction: result ok', function (fin) {
    // Mocks the requester
    requester.post = function (options, path, data) {
      return new Promise(function (resolve, reject) {
        return resolve({ data: { results: [{foo: 'bar'}] } })
      })
    }
    //
    httpapi.executeTransaction(testConfig, ['foo'])
    .then(function (result) {
      requester.post = postCurrent
      expect(result.success).to.equal(true)
      fin()
    })
  })
  // Query
  it('query: error', function (fin) {
    // Mocks the requester
    requester.get = function (options, path, data) {
      return new Promise(function (resolve, reject) {
        return reject(new Error(errMsg))
      })
    }
    //
    const queryString = 'foo'
    httpapi.query(testConfig, queryString)
    .catch(function (err) {
      requester.get = getCurrent
      expect(err.message).to.equal(errMsg)
      expect(err.query).to.equal(queryString)
      fin()
    })
  })
  //
  it('query: result error', function (fin) {
    // Mocks the requester
    requester.get = function (options, path, data) {
      return new Promise(function (resolve, reject) {
        return resolve({ data: { results: [{error: errMsg}] } })
      })
    }
    //
    const queryString = 'foo'
    httpapi.query(testConfig, queryString)
    .catch(function (err) {
      requester.get = getCurrent
      expect(err.error).to.equal(errMsg)
      expect(err.query).to.equal(queryString)
      fin()
    })
  })
  //
  it('query: result get values error', function (fin) {
    // Mocks the requester
    const item = 'No JSON'
    requester.get = function (options, path, data) {
      return new Promise(function (resolve, reject) {
        return resolve({ data: { results: [{values: [item]}] } })
      })
    }
    //
    const queryString = 'foo'
    httpapi.query(testConfig, queryString)
    .catch(function (err) {
      requester.get = getCurrent
      expect(err.error.message.indexOf('Unexpected token') > -1).to.equal(true)
      expect(err.query).to.equal(queryString)
      expect(err.item).to.equal(item)
      fin()
    })
  })
  //
  it('query: result get values ok', function (fin) {
    // Mocks the requester
    const items = [['{"foo":"bar"}'], ['{"abc":123}']]
    requester.get = function (options, path, data) {
      return new Promise(function (resolve, reject) {
        return resolve({ data: { results: [{values: items}] } })
      })
    }
    //
    const queryString = 'foo'
    httpapi.query(testConfig, queryString)
    .then(function (result) {
      requester.get = getCurrent
      expect(result.length).to.equal(items.length)
      expect(result[0].foo).to.equal('bar')
      expect(result[1].abc).to.equal(123)
      fin()
    })
  })
  // Gets values
  it('get values: no response', function (fin) {
    httpapi.getValues({})
    .then(function (result) {
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
