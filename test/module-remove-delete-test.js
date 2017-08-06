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
const moduleList = require('../module-list')
const Seneca = require('seneca')
const testFunctions = require('./functions')
const testConfig = require('./config')

const moduleRemove = require('../module-remove')

// Test prerequisites
const Code = require('code')
const Lab = require('lab', {timeout: testFunctions.timeout})
const lab = (exports.lab = Lab.script())
const before = lab.before
const describe = lab.describe
const it = lab.it
const expect = Code.expect

// Seneca
var seneca
const errMsg = 'ko'
// Mocks the module
const deleteIdCurrent = moduleRemove.deleteId
// Mocks the http api
const executeCurrent = httpapi.execute
const executeTransactionCurrent = httpapi.executeTransaction
// Mocks the options
const ignoreNoSuchTableErrorCurrent = testConfig.ignore_no_such_table_error
// Mocks the list
const listCurrent = moduleList.list

describe('module remove delete', {timeout: testFunctions.timeout}, function () {
  //
  before((fin) => {
    // Sets the Seneca instance
    seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
    fin()
  })
  // Delete first
  it('first: no list', function (fin) {
    moduleRemove.deleteFirst(testConfig, {}, [])
    .then(function (result) {
      expect(result).to.not.exist()
      fin()
    })
  })
  //
  it('first: list and delete on error', function (fin) {
    // Mocks the module
    moduleRemove.deleteId = function (options, args) {
      return new Promise(function (resolve, reject) {
        return reject(new Error(errMsg))
      })
    }
    // Sets the parameter
    const id = '004'
    const entityFactory = seneca.make(base, entityName)
    const entity = entityFactory.make$({id: id})
    const args = { qent: entity, q: {} }
    //
    moduleRemove.deleteFirst(testConfig, args, [{id: 'foo'}])
    .catch(function (err) {
      moduleRemove.deleteId = deleteIdCurrent
      expect(err.message).to.equal(errMsg)
      fin()
    })
  })
  //
  it('first: list, delete ok, no load', function (fin) {
    // Mocks the module
    moduleRemove.deleteId = function (options, args) {
      return new Promise(function (resolve, reject) {
        return resolve({success: true})
      })
    }
    // Sets the parameter
    const id = '004'
    const entityFactory = seneca.make(base, entityName)
    const entity = entityFactory.make$({id: id})
    const args = { qent: entity, q: {} }
    //
    moduleRemove.deleteFirst(testConfig, args, [{id: 'foo'}])
    .then(function (result) {
      moduleRemove.deleteId = deleteIdCurrent
      expect(result).to.not.exist()
      fin()
    })
  })
  //
  it('first: list, delete ok, load', function (fin) {
    // Mocks the module
    moduleRemove.deleteId = function (options, args) {
      return new Promise(function (resolve, reject) {
        return resolve({success: true})
      })
    }
    // Sets the parameter
    const id = '004'
    const entityFactory = seneca.make(base, entityName)
    const entity = entityFactory.make$({id: id})
    const args = { qent: entity, q: {load$: true} }
    //
    moduleRemove.deleteFirst(testConfig, args, [{id: id}])
    .then(function (result) {
      moduleRemove.deleteId = deleteIdCurrent
      expect(result.id).to.equal(id)
      fin()
    })
  })
  // Delete ID
  it('id: error and not ignore', function (fin) {
    // Mocks the http api
    httpapi.execute = function (options, statement) {
      return new Promise(function (resolve, reject) {
        return reject(new Error(errMsg))
      })
    }
    // Sets the parameter
    const id = '004'
    const entityFactory = seneca.make(base, entityName)
    const entity = entityFactory.make$({id: id})
    const args = { qent: entity, q: {id: id} }
    //
    moduleRemove.deleteId(testConfig, args)
    .catch(function (err) {
      httpapi.execute = executeCurrent
      expect(err.message).to.equal(errMsg)
      fin()
    })
  })
  //
  it('id: error and ignore', function (fin) {
    // Mocks the options
    testConfig.ignore_no_such_table_error = true
    // Mocks the http api
    httpapi.execute = function (options, statement) {
      return new Promise(function (resolve, reject) {
        return reject({error: testConfig.nosuchtable})
      })
    }
    // Sets the parameter
    const id = '004'
    const entityFactory = seneca.make(base, entityName)
    const entity = entityFactory.make$({id: id})
    const args = { qent: entity, q: {id: id} }
    //
    moduleRemove.deleteId(testConfig, args)
    .then(function (result) {
      testConfig.ignore_no_such_table_error = ignoreNoSuchTableErrorCurrent
      httpapi.execute = executeCurrent
      expect(result.success).to.equal(true)
      fin()
    })
  })
  //
  it('id: ok', function (fin) {
    const id = '004'
    // Mocks the http api
    httpapi.execute = function (options, statement) {
      return new Promise(function (resolve, reject) {
        return resolve({id: id})
      })
    }
    // Sets the parameter
    const entityFactory = seneca.make(base, entityName)
    const entity = entityFactory.make$({id: id})
    const args = { qent: entity, q: {id: id} }
    //
    moduleRemove.deleteId(testConfig, args)
    .then(function (result) {
      httpapi.execute = executeCurrent
      expect(result.id).to.equal(id)
      fin()
    })
  })
  // Delete all
  it('all: filters, list on error', function (fin) {
    // Mocks the list
    moduleList.list = function (options, statement) {
      return new Promise(function (resolve, reject) {
        return reject(new Error(errMsg))
      })
    }
    // Sets the parameter
    const id = '004'
    const entityFactory = seneca.make(base, entityName)
    const entity = entityFactory.make$({id: id})
    const args = { qent: entity, q: {all$: true, id: id} }
    //
    moduleRemove.deleteAll(testConfig, args)
    .catch(function (err) {
      moduleList.list = listCurrent
      expect(err.message).to.equal(errMsg)
      fin()
    })
  })
  //
  it('all: filters, list ok, no result', function (fin) {
    // Mocks the list
    moduleList.list = function (options, statement) {
      return new Promise(function (resolve, reject) {
        return resolve([])
      })
    }
    // Sets the parameter
    const id = '004'
    const entityFactory = seneca.make(base, entityName)
    const entity = entityFactory.make$({id: id})
    const args = { qent: entity, q: {all$: true, id: id} }
    //
    moduleRemove.deleteAll(testConfig, args)
    .then(function (result) {
      moduleList.list = listCurrent
      expect(result.success).to.equal(true)
      fin()
    })
  })
  //
  it('all: filters, list ok, results', function (fin) {
    // Mocks the list
    const items = [{id: 'foo'}, {id: 'bar'}]
    moduleList.list = function (options, statement) {
      return new Promise(function (resolve, reject) {
        return resolve(items)
      })
    }
    // Mocks the module
    moduleRemove.deleteId = function (options, statement) {
      return new Promise(function (resolve, reject) {
        return resolve({success: true})
      })
    }
    // Sets the parameter
    const id = '004'
    const entityFactory = seneca.make(base, entityName)
    const entity = entityFactory.make$({id: id})
    const args = { qent: entity, q: {all$: true, id: id} }
    //
    moduleRemove.deleteAll(testConfig, args)
    .then(function (result) {
      moduleList.list = listCurrent
      moduleRemove.deleteId = deleteIdCurrent
      expect(result.success).to.equal(true)
      expect(result.results.length).to.equal(items.length)
      fin()
    })
  })
  //
  it('all: no filter, error', function (fin) {
    // Mocks the http api
    httpapi.executeTransaction = function (options, statement) {
      return new Promise(function (resolve, reject) {
        return reject(new Error(errMsg))
      })
    }
    // Sets the parameter
    const id = '004'
    const entityFactory = seneca.make(base, entityName)
    const entity = entityFactory.make$({id: id})
    const args = { qent: entity, q: {all$: true} }
    //
    moduleRemove.deleteAll(testConfig, args)
    .catch(function (err) {
      httpapi.executeTransaction = executeTransactionCurrent
      expect(err.message).to.equal(errMsg)
      fin()
    })
  })
  //
  it('all: no filter, ok', function (fin) {
    // Mocks the http api
    httpapi.executeTransaction = function (options, statement) {
      return new Promise(function (resolve, reject) {
        return resolve({success: true})
      })
    }
    // Sets the parameter
    const id = '004'
    const entityFactory = seneca.make(base, entityName)
    const entity = entityFactory.make$({id: id})
    const args = { qent: entity, q: {all$: true} }
    //
    moduleRemove.deleteAll(testConfig, args)
    .then(function (result) {
      httpapi.executeTransaction = executeTransactionCurrent
      expect(result.success).to.equal(true)
      fin()
    })
  })
  //
})
