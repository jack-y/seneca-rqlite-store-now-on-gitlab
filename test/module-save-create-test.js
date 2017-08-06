/* Copyright (c) 2017 e-soa Jacques Desodt, MIT License */
'use strict'

/**
 * TESTS DIRECTLY ON THE MODULE
**/

// Default plugin options
const pluginName = 'rqlite-store'
const role = pluginName + '-test'
const base = null
const entityName = 'test'

// Prerequisites
const httpapi = require('../http-api')
const moduleSave = require('../module-save')
const Seneca = require('seneca')
const testFunctions = require('./functions')
const testConfig = require('./config')

// Test prerequisites
const Code = require('code')
const Lab = require('lab')
const lab = (exports.lab = Lab.script())
const before = lab.before
const describe = lab.describe
const it = lab.it
const expect = Code.expect

// Seneca
var seneca
const errMsg = 'ko'
// Mocks the http api
const executeCurrent = httpapi.execute
// Mocks the options
const ignoreNoSuchTableErrorCurrent = testConfig.ignore_no_such_table_error
// Mocks the module
const createTableCurrent = moduleSave.createTable
const createCurrent = moduleSave.create

describe('module save create', {timeout: testFunctions.timeout}, function () {
  //
  before((fin) => {
    // Sets the Seneca instance
    seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
    fin()
  })
  // Create
  it('error, not ignore', function (fin) {
    // Mocks the http api
    httpapi.execute = function (options, statement) {
      return new Promise(function (resolve, reject) {
        return reject(new Error(errMsg))
      })
    }
    // Sets the parameter
    const entityFactory = seneca.make(base, entityName)
    const entity = entityFactory.make$({name: 'foo'})
    //
    moduleSave.create(testConfig, entity)
    .catch(function (err) {
      httpapi.execute = executeCurrent
      expect(err.message).to.equal(errMsg)
      fin()
    })
  })
  //
  it('error, ignore, create table on error', function (fin) {
    // Mocks the options
    testConfig.ignore_no_such_table_error = true
    // Mocks the http api
    httpapi.execute = function (options, statement) {
      return new Promise(function (resolve, reject) {
        return reject({error: testConfig.nosuchtable})
      })
    }
    // Mocks the module
    moduleSave.createTable = function (options, tablename) {
      return new Promise(function (resolve, reject) {
        return reject(new Error(errMsg))
      })
    }
    // Sets the parameter
    const entityFactory = seneca.make(base, entityName)
    const entity = entityFactory.make$({name: 'foo'})
    //
    moduleSave.create(testConfig, entity)
    .catch(function (err) {
      testConfig.ignore_no_such_table_error = ignoreNoSuchTableErrorCurrent
      httpapi.execute = executeCurrent
      moduleSave.createTable = createTableCurrent
      expect(err.message).to.equal(errMsg)
      fin()
    })
  })
  //
  it('error, ignore, create table ok, create on error', function (fin) {
    // Mocks the options
    testConfig.ignore_no_such_table_error = true
    // Mocks the http api
    httpapi.execute = function (options, statement) {
      return new Promise(function (resolve, reject) {
        return reject({error: testConfig.nosuchtable})
      })
    }
    // Mocks the module
    moduleSave.createTable = function (options, tablename) {
      return new Promise(function (resolve, reject) {
        // Mocks the next create
        moduleSave.create = function (options, tablename) {
          return new Promise(function (resolve, reject) {
            return reject(new Error(errMsg))
          })
        }
        return resolve({success: true})
      })
    }
    // Sets the parameter
    const entityFactory = seneca.make(base, entityName)
    const entity = entityFactory.make$({name: 'foo'})
    //
    moduleSave.create(testConfig, entity)
    .catch(function (err) {
      testConfig.ignore_no_such_table_error = ignoreNoSuchTableErrorCurrent
      httpapi.execute = executeCurrent
      moduleSave.createTable = createTableCurrent
      moduleSave.create = createCurrent
      expect(err.message).to.equal(errMsg)
      fin()
    })
  })
  //
  it('error, ignore, create table ok, create ok', function (fin) {
    // Mocks the options
    testConfig.ignore_no_such_table_error = true
    // Mocks the http api
    httpapi.execute = function (options, statement) {
      return new Promise(function (resolve, reject) {
        return reject({error: testConfig.nosuchtable})
      })
    }
    // Mocks the module
    moduleSave.createTable = function (options, tablename) {
      return new Promise(function (resolve, reject) {
        // Mocks the next create
        moduleSave.create = function (options, tablename) {
          return new Promise(function (resolve, reject) {
            return resolve({success: true})
          })
        }
        return resolve({success: true})
      })
    }
    // Sets the parameter
    const entityFactory = seneca.make(base, entityName)
    const entity = entityFactory.make$({name: 'foo'})
    //
    moduleSave.create(testConfig, entity)
    .then(function (result) {
      testConfig.ignore_no_such_table_error = ignoreNoSuchTableErrorCurrent
      httpapi.execute = executeCurrent
      moduleSave.createTable = createTableCurrent
      moduleSave.create = createCurrent
      expect(result.success).to.equal(true)
      fin()
    })
  })
  //
  it('ok', function (fin) {
    // Mocks the http api
    httpapi.execute = function (options, statement) {
      return new Promise(function (resolve, reject) {
        return resolve({success: true})
      })
    }
    // Sets the parameter
    const name = 'foo'
    const entityFactory = seneca.make(base, entityName)
    const entity = entityFactory.make$({name: name})
    //
    moduleSave.create(testConfig, entity)
    .then(function (result) {
      httpapi.execute = executeCurrent
      expect(result.id.length > 8).to.equal(true)
      expect(result.name).to.equal(name)
      fin()
    })
  })
  //
})
