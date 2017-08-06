/* Copyright (c) 2017 e-soa Jacques Desodt, MIT License */
'use strict'

/**
 * TESTS DIRECTLY ON THE MODULE
**/

// Prerequisites
const httpapi = require('../http-api')
const moduleSave = require('../module-save')
const testFunctions = require('./functions')
const testConfig = require('./config')

// Test prerequisites
const Code = require('code')
const Lab = require('lab')
const lab = (exports.lab = Lab.script())
const describe = lab.describe
const it = lab.it
const expect = Code.expect

const errMsg = 'ko'
// Mocks the module
const createCurrent = moduleSave.create
const updateCurrent = moduleSave.update
// Mocks the http api
const executeCurrent = httpapi.execute

describe('module save', {timeout: testFunctions.timeout}, function () {
  //
  // Save
  it('no arg', function (fin) {
    moduleSave.save(testConfig, {})
    .catch(function (err) {
      expect(err.error).to.equal(testConfig.badarguments)
      fin()
    })
  })
  //
  it('no id, create on error', function (fin) {
    // Mocks the module
    moduleSave.create = function (options, args) {
      return new Promise(function (resolve, reject) {
        return reject(new Error(errMsg))
      })
    }
    //
    moduleSave.save(testConfig, {ent: {}})
    .catch(function (err) {
      moduleSave.create = createCurrent
      expect(err.message).to.equal(errMsg)
      fin()
    })
  })
  //
  it('no id, create ok', function (fin) {
    // Mocks the module
    const id = 'abc'
    moduleSave.create = function (options, args) {
      return new Promise(function (resolve, reject) {
        return resolve({id: id})
      })
    }
    //
    moduleSave.save(testConfig, {ent: {}})
    .then(function (result) {
      moduleSave.create = createCurrent
      expect(result.id).to.equal(id)
      fin()
    })
  })
  //
  it('with id, update on error', function (fin) {
    // Mocks the module
    moduleSave.update = function (options, args) {
      return new Promise(function (resolve, reject) {
        return reject(new Error(errMsg))
      })
    }
    //
    moduleSave.save(testConfig, {ent: {id: 'foo'}})
    .catch(function (err) {
      moduleSave.update = updateCurrent
      expect(err.message).to.equal(errMsg)
      fin()
    })
  })
  //
  it('with id, update ok', function (fin) {
    // Mocks the module
    moduleSave.update = function (options, args) {
      return new Promise(function (resolve, reject) {
        return resolve({success: true})
      })
    }
    //
    moduleSave.save(testConfig, {ent: {id: 'foo'}})
    .then(function (result) {
      moduleSave.update = updateCurrent
      expect(result.success).to.equal(true)
      fin()
    })
  })
  // Create table
  it('create table: on error', function (fin) {
    // Mocks the http api
    httpapi.execute = function (options, statement) {
      return new Promise(function (resolve, reject) {
        return reject(new Error(errMsg))
      })
    }
    //
    moduleSave.createTable(testConfig, 'foo')
    .catch(function (err) {
      httpapi.execute = executeCurrent
      expect(err.message).to.equal(errMsg)
      fin()
    })
  })
  //
  it('create table: ok', function (fin) {
    // Mocks the http api
    httpapi.execute = function (options, statement) {
      return new Promise(function (resolve, reject) {
        return resolve({success: true})
      })
    }
    //
    moduleSave.createTable(testConfig, 'foo')
    .then(function (result) {
      httpapi.execute = executeCurrent
      expect(result.success).to.equal(true)
      fin()
    })
  })
  // Set ID
  it('set id: no id, no id$', function (fin) {
    var entity = {name: 'foo'}
    moduleSave.setId(entity)
    expect(entity.id.length > 8).to.equal(true)
    fin()
  })
  //
  it('set id: no id, with id$', function (fin) {
    const id = '123'
    var entity = {name: 'foo', id$: id}
    moduleSave.setId(entity)
    expect(entity.id).to.equal(id)
    expect(entity.id$).to.not.exist()
    fin()
  })
  //
  it('set id: with id', function (fin) {
    const id = '123'
    var entity = {name: 'foo', id: id}
    moduleSave.setId(entity)
    expect(entity.id).to.equal(id)
    fin()
  })
  //
})
