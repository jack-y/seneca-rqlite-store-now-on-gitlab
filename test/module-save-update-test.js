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
const queryCurrent = httpapi.query
const executeCurrent = httpapi.execute
// Mocks the options
const ignoreNoSuchTableErrorCurrent = testConfig.ignore_no_such_table_error
const mergeCurrent = testConfig.merge
// Mocks the module
const createTableCurrent = moduleSave.createTable
const createCurrent = moduleSave.create

describe('module save update', {timeout: testFunctions.timeout}, function () {
  //
  before((fin) => {
    // Sets the Seneca instance
    seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
    fin()
  })
  // Update
  it('query error, not ignore', function (fin) {
    // Mocks the http api
    httpapi.query = function (options, statement) {
      return new Promise(function (resolve, reject) {
        return reject(new Error(errMsg))
      })
    }
    // Sets the parameter
    const id = '005'
    const entityFactory = seneca.make(base, entityName)
    const entity = entityFactory.make$({id: id, name: 'foo'})
    //
    moduleSave.update(testConfig, entity)
    .catch(function (err) {
      httpapi.query = queryCurrent
      expect(err.message).to.equal(errMsg)
      fin()
    })
  })
  //
  it('query error, ignore, create table on error', function (fin) {
    // Mocks the options
    testConfig.ignore_no_such_table_error = true
    // Mocks the http api
    httpapi.query = function (options, statement) {
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
    const id = '005'
    const entityFactory = seneca.make(base, entityName)
    const entity = entityFactory.make$({id: id, name: 'foo'})
    //
    moduleSave.update(testConfig, entity)
    .catch(function (err) {
      testConfig.ignore_no_such_table_error = ignoreNoSuchTableErrorCurrent
      httpapi.query = queryCurrent
      moduleSave.createTable = createTableCurrent
      expect(err.message).to.equal(errMsg)
      fin()
    })
  })
  //
  it('query error, ignore, create table ok, create on error', function (fin) {
    // Mocks the options
    testConfig.ignore_no_such_table_error = true
    // Mocks the http api
    httpapi.query = function (options, statement) {
      return new Promise(function (resolve, reject) {
        return reject({error: testConfig.nosuchtable})
      })
    }
    // Mocks the module
    moduleSave.createTable = function (options, tablename) {
      return new Promise(function (resolve, reject) {
        return resolve({success: true})
      })
    }
    moduleSave.create = function (options, entity) {
      return new Promise(function (resolve, reject) {
        return reject(new Error(errMsg))
      })
    }
    // Sets the parameter
    const id = '005'
    const entityFactory = seneca.make(base, entityName)
    const entity = entityFactory.make$({id: id, name: 'foo'})
    //
    moduleSave.update(testConfig, entity)
    .catch(function (err) {
      testConfig.ignore_no_such_table_error = ignoreNoSuchTableErrorCurrent
      httpapi.query = queryCurrent
      moduleSave.createTable = createTableCurrent
      moduleSave.create = createCurrent
      expect(err.message).to.equal(errMsg)
      fin()
    })
  })
  //
  it('query error, ignore, create table ok, create ok', function (fin) {
    // Mocks the options
    testConfig.ignore_no_such_table_error = true
    // Mocks the http api
    httpapi.query = function (options, statement) {
      return new Promise(function (resolve, reject) {
        return reject({error: testConfig.nosuchtable})
      })
    }
    // Mocks the module
    moduleSave.createTable = function (options, tablename) {
      return new Promise(function (resolve, reject) {
        return resolve({success: true})
      })
    }
    moduleSave.create = function (options, entity) {
      return new Promise(function (resolve, reject) {
        return resolve(entity)
      })
    }
    // Sets the parameter
    const id = '005'
    const entityFactory = seneca.make(base, entityName)
    const entity = entityFactory.make$({id: id, name: 'foo'})
    //
    moduleSave.update(testConfig, entity)
    .then(function (result) {
      testConfig.ignore_no_such_table_error = ignoreNoSuchTableErrorCurrent
      httpapi.query = queryCurrent
      moduleSave.createTable = createTableCurrent
      moduleSave.create = createCurrent
      expect(result).to.equal(entity)
      fin()
    })
  })
  //
  it('query ok, no result, create on error', function (fin) {
    // Mocks the http api
    httpapi.query = function (options, statement) {
      return new Promise(function (resolve, reject) {
        return resolve([])
      })
    }
    // Mocks the module
    moduleSave.create = function (options, entity) {
      return new Promise(function (resolve, reject) {
        return reject(new Error(errMsg))
      })
    }
    // Sets the parameter
    const id = '005'
    const entityFactory = seneca.make(base, entityName)
    const entity = entityFactory.make$({id: id, name: 'foo'})
    //
    moduleSave.update(testConfig, entity)
    .catch(function (err) {
      httpapi.query = queryCurrent
      moduleSave.create = createCurrent
      expect(err.message).to.equal(errMsg)
      fin()
    })
  })
  //
  it('query ok, no result, create ok', function (fin) {
    // Mocks the http api
    httpapi.query = function (options, statement) {
      return new Promise(function (resolve, reject) {
        return resolve([])
      })
    }
    // Mocks the module
    moduleSave.create = function (options, entity) {
      return new Promise(function (resolve, reject) {
        return resolve(entity)
      })
    }
    // Sets the parameter
    const id = '005'
    const entityFactory = seneca.make(base, entityName)
    const entity = entityFactory.make$({id: id, name: 'foo'})
    //
    moduleSave.update(testConfig, entity)
    .then(function (result) {
      httpapi.query = queryCurrent
      moduleSave.create = createCurrent
      expect(result).to.equal(entity)
      fin()
    })
  })
  //
  it('query ok, with result, update error', function (fin) {
    const id = '005'
    // Mocks the http api
    httpapi.query = function (options, statement) {
      return new Promise(function (resolve, reject) {
        return resolve([{id: id, name: 'foo'}])
      })
    }
    httpapi.execute = function (options, statement) {
      return new Promise(function (resolve, reject) {
        return reject(new Error(errMsg))
      })
    }
    // Sets the parameter
    const entityFactory = seneca.make(base, entityName)
    const entity = entityFactory.make$({id: id, name: 'foo'})
    //
    moduleSave.update(testConfig, entity)
    .catch(function (err) {
      httpapi.query = queryCurrent
      httpapi.execute = executeCurrent
      expect(err.message).to.equal(errMsg)
      fin()
    })
  })
  //
  it('query ok, with result, no merge, update ok', function (fin) {
    const id = '005'
    const previous = {id: id, name: 'bar'}
    const updated = {id: id, name: 'foo'}
    // Mocks the options
    testConfig.merge = false
    // Mocks the http api
    httpapi.query = function (options, statement) {
      return new Promise(function (resolve, reject) {
        return resolve([previous])
      })
    }
    httpapi.execute = function (options, statement) {
      return new Promise(function (resolve, reject) {
        return resolve(updated)
      })
    }
    // Sets the parameter
    const entityFactory = seneca.make(base, entityName)
    const entity = entityFactory.make$(updated)
    //
    moduleSave.update(testConfig, entity)
    .then(function (result) {
      testConfig.merge = mergeCurrent
      httpapi.query = queryCurrent
      httpapi.execute = executeCurrent
      expect(result.name).to.equal(entity.name)
      fin()
    })
  })
  //
  it('query ok, with result, with merge, update ok', function (fin) {
    const id = '005'
    const previous = {id: id, name: 'bar', zipcode: '59491'}
    const updated = {id: id, name: 'foo', merge$: true}
    const expected = {id: id, name: 'foo', zipcode: '59491'}
    // Mocks the options
    testConfig.merge = true
    // Mocks the http api
    httpapi.query = function (options, statement) {
      return new Promise(function (resolve, reject) {
        return resolve([previous])
      })
    }
    httpapi.execute = function (options, statement) {
      return new Promise(function (resolve, reject) {
        return resolve(expected)
      })
    }
    // Sets the parameter
    const entityFactory = seneca.make(base, entityName)
    const entity = entityFactory.make$(updated)
    //
    moduleSave.update(testConfig, entity)
    .then(function (result) {
      testConfig.merge = mergeCurrent
      httpapi.query = queryCurrent
      httpapi.execute = executeCurrent
      expect(result.name).to.equal(updated.name)
      expect(result.zipcode).to.equal(previous.zipcode)
      fin()
    })
  })
  //
})
