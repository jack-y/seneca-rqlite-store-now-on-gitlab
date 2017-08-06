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
const deleteAllCurrent = moduleRemove.deleteAll
const deleteFirstCurrent = moduleRemove.deleteFirst
// Mocks the http api
const queryCurrent = httpapi.query
// Mocks the list
const listCurrent = moduleList.list

describe('module remove', {timeout: testFunctions.timeout}, function () {
  //
  before((fin) => {
    // Sets the Seneca instance
    seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
    fin()
  })
  // Remove
  it('no arg', function (fin) {
    moduleRemove.remove(testConfig, {})
    .catch(function (err) {
      expect(err.error).to.equal(testConfig.badarguments)
      fin()
    })
  })
  //
  it('arg all$ on error', function (fin) {
    // Mocks the module
    moduleRemove.deleteAll = function (options, args) {
      return new Promise(function (resolve, reject) {
        return reject(new Error(errMsg))
      })
    }
    //
    moduleRemove.remove(testConfig, {qent: {}, q: {all$: true}})
    .catch(function (err) {
      moduleRemove.deleteAll = deleteAllCurrent
      expect(err.message).to.equal(errMsg)
      fin()
    })
  })
  //
  it('arg all$ ok', function (fin) {
    // Mocks the module
    moduleRemove.deleteAll = function (options, args) {
      return new Promise(function (resolve, reject) {
        return resolve({success: true})
      })
    }
    //
    moduleRemove.remove(testConfig, {qent: {}, q: {all$: true}})
    .then(function (result) {
      moduleRemove.deleteAll = deleteAllCurrent
      expect(result).to.not.exist()
      fin()
    })
  })
  //
  it('no filter, on error', function (fin) {
    // Mocks the http api
    httpapi.query = function (options, args) {
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
    moduleRemove.remove(testConfig, args)
    .catch(function (err) {
      httpapi.query = queryCurrent
      expect(err.message).to.equal(errMsg)
      fin()
    })
  })
  //
  it('no filter, ok, no result', function (fin) {
    // Mocks the http api
    httpapi.query = function (options, args) {
      return new Promise(function (resolve, reject) {
        return resolve([])
      })
    }
    // Sets the parameter
    const id = '004'
    const entityFactory = seneca.make(base, entityName)
    const entity = entityFactory.make$({id: id})
    const args = { qent: entity, q: {} }
    //
    moduleRemove.remove(testConfig, args)
    .then(function (result) {
      httpapi.query = queryCurrent
      expect(result).to.not.exist()
      fin()
    })
  })
  //
  it('no filter, ok, result, delete error', function (fin) {
    // Mocks the http api
    httpapi.query = function (options, args) {
      return new Promise(function (resolve, reject) {
        return resolve([{'foo': 'bar'}])
      })
    }
    // Mocks the module
    moduleRemove.deleteFirst = function (options, args) {
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
    moduleRemove.remove(testConfig, args)
    .catch(function (err) {
      httpapi.query = queryCurrent
      moduleRemove.deleteFirst = deleteFirstCurrent
      expect(err.message).to.equal(errMsg)
      fin()
    })
  })
  //
  it('no filter, ok, result, delete ok', function (fin) {
    // Mocks the http api
    httpapi.query = function (options, args) {
      return new Promise(function (resolve, reject) {
        return resolve([{'foo': 'bar'}])
      })
    }
    // Mocks the module
    moduleRemove.deleteFirst = function (options, args) {
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
    moduleRemove.remove(testConfig, args)
    .then(function (result) {
      httpapi.query = queryCurrent
      moduleRemove.deleteFirst = deleteFirstCurrent
      expect(result.success).to.equal(true)
      fin()
    })
  })
  //
  it('filter, list on error', function (fin) {
    // Mocks the module
    moduleList.list = function (options, args) {
      return new Promise(function (resolve, reject) {
        return reject(new Error(errMsg))
      })
    }
    // Sets the parameter
    const id = '004'
    const entityFactory = seneca.make(base, entityName)
    const entity = entityFactory.make$({id: id})
    const args = { qent: entity, q: {name: 'foo'} }
    //
    moduleRemove.remove(testConfig, args)
    .catch(function (err) {
      moduleList.list = listCurrent
      expect(err.message).to.equal(errMsg)
      fin()
    })
  })
  //
  it('filter, list ok, delete on error', function (fin) {
    // Mocks the list
    moduleList.list = function (options, args) {
      return new Promise(function (resolve, reject) {
        return resolve({foo: 'bar'})
      })
    }
    // Mocks the delete
    moduleRemove.deleteFirst = function (options, args) {
      return new Promise(function (resolve, reject) {
        return reject(new Error(errMsg))
      })
    }
    // Sets the parameter
    const id = '004'
    const entityFactory = seneca.make(base, entityName)
    const entity = entityFactory.make$({id: id})
    const args = { qent: entity, q: {name: 'foo'} }
    //
    moduleRemove.remove(testConfig, args)
    .catch(function (err) {
      moduleList.list = listCurrent
      moduleRemove.deleteFirst = deleteFirstCurrent
      expect(err.message).to.equal(errMsg)
      fin()
    })
  })
  //
  it('filter, list ok, delete ok', function (fin) {
    // Mocks the list
    moduleList.list = function (options, args) {
      return new Promise(function (resolve, reject) {
        return resolve({foo: 'bar'})
      })
    }
    // Mocks the delete
    moduleRemove.deleteFirst = function (options, args) {
      return new Promise(function (resolve, reject) {
        return resolve({success: true})
      })
    }
    // Sets the parameter
    const id = '004'
    const entityFactory = seneca.make(base, entityName)
    const entity = entityFactory.make$({id: id})
    const args = { qent: entity, q: {name: 'foo'} }
    //
    moduleRemove.remove(testConfig, args)
    .then(function (result) {
      moduleList.list = listCurrent
      moduleRemove.deleteFirst = deleteFirstCurrent
      expect(result.success).to.equal(true)
      fin()
    })
  })
  //
})
