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
const moduleLoad = require('../module-load')
const moduleList = require('../module-list')
const Seneca = require('seneca')
const testConfig = require('./config')
const testFunctions = require('./functions')

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
// Mocks the options
const ignoreNoSuchTableErrorCurrent = testConfig.ignore_no_such_table_error
// Mocks the list
const listCurrent = moduleList.list

describe('module load', {timeout: testFunctions.timeout}, function () {
  //
  before((fin) => {
    // Sets the Seneca instance
    seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
    fin()
  })
  // Bad argument
  it('no arg', function (fin) {
    moduleLoad.load(testConfig, {})
    .catch(function (err) {
      expect(err.error).to.equal(testConfig.badarguments)
      fin()
    })
  })
  //
  it('filters: id, query error and not ignore', function (fin) {
    // Mocks the http api
    httpapi.query = function (options, queryString) {
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
    moduleLoad.load(testConfig, args)
    .catch(function (err) {
      httpapi.query = queryCurrent
      expect(err.message).to.equal(errMsg)
      fin()
    })
  })
  //
  it('filters: id, query error and ignore', function (fin) {
    // Mocks the options
    testConfig.ignore_no_such_table_error = true
    // Mocks the http api
    httpapi.query = function (options, queryString) {
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
    moduleLoad.load(testConfig, args)
    .then(function (result) {
      testConfig.ignore_no_such_table_error = ignoreNoSuchTableErrorCurrent
      httpapi.query = queryCurrent
      expect(result).to.not.exist()
      fin()
    })
  })
  //
  it('filters: id, query ok and no result', function (fin) {
    // Mocks the http api
    httpapi.query = function (options, queryString) {
      return new Promise(function (resolve, reject) {
        return resolve([])
      })
    }
    // Sets the parameter
    const id = '004'
    const entityFactory = seneca.make(base, entityName)
    const entity = entityFactory.make$({id: id})
    const args = { qent: entity, q: {id: id} }
    //
    moduleLoad.load(testConfig, args)
    .then(function (result) {
      httpapi.query = queryCurrent
      expect(result).to.not.exist()
      fin()
    })
  })
  //
  it('filters: id, query ok and one result', function (fin) {
    const items = [{foo: 'bar'}, {abc: 123}]
    // Mocks the http api
    httpapi.query = function (options, queryString) {
      return new Promise(function (resolve, reject) {
        return resolve(items)
      })
    }
    // Sets the parameter
    const id = '004'
    const entityFactory = seneca.make(base, entityName)
    const entity = entityFactory.make$({id: id})
    const args = { qent: entity, q: {id: id} }
    //
    moduleLoad.load(testConfig, args)
    .then(function (result) {
      httpapi.query = queryCurrent
      expect(result.foo).to.equal('bar')
      fin()
    })
  })
  //
  it('filters: others and error', function (fin) {
    // Mocks the list
    moduleList.list = function (options, args) {
      return new Promise(function (resolve, reject) {
        return reject(new Error(errMsg))
      })
    }
    // Sets the parameter
    const args = { qent: {}, q: {name: 'foo'} }
    //
    moduleLoad.load(testConfig, args)
    .catch(function (err) {
      moduleList.list = listCurrent
      expect(err.message).to.equal(errMsg)
      fin()
    })
  })
  //
  it('filters: others and result', function (fin) {
    const items = [{foo: 'bar'}, {abc: 123}]
    // Mocks the http api
    moduleList.list = function (options, args) {
      return new Promise(function (resolve, reject) {
        return resolve(items)
      })
    }
    // Sets the parameter
    const id = '004'
    const entityFactory = seneca.make(base, entityName)
    const entity = entityFactory.make$({id: id})
    const args = { qent: entity, q: {name: 'foo'} }
    //
    moduleLoad.load(testConfig, args)
    .then(function (result) {
      moduleList.list = listCurrent
      expect(result.foo).to.equal('bar')
      fin()
    })
  })
  //
})
