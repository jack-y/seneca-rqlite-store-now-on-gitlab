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
const Seneca = require('seneca')
const testFunctions = require('./functions')
const testConfig = require('./config')

const moduleRemove = require('../module-remove')

// Test prerequisites
const Code = require('code')
const Lab = require('lab', {timeout: testFunctions.timeout})
var lab = (exports.lab = Lab.script())
var describe = lab.describe
var it = lab.it
var expect = Code.expect

describe('module remove', {timeout: testFunctions.timeout}, function () {
  //
  // Bad argument
  it('no arg', function (fin) {
    moduleRemove.remove(null, {})
    .catch(function (err) {
      expect(err).to.exist()
      fin()
    })
  })
  // Ignore the 'no such table' error
  it('ignore no such table', function (fin) {
    // Drops the table
    testFunctions.dropTable(testConfig, base, entityName)
    .then(function (result) {
      // Gets the Seneca instance
      var oldOption = testConfig.ignore_no_such_table_error
      testConfig.ignore_no_such_table_error = true
      var seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
      var entityFactory = seneca.make(base, entityName)
      var qent = entityFactory.make$({f1: 'v1'})
      moduleRemove.deleteId(testConfig, {q: {id: '007'}, qent: qent})
      .then(function (result) {
        testConfig.ignore_no_such_table_error = oldOption
        expect(result).to.exist()
        fin()
      })
    })
  })
  // Catchs the 'no such table' error
  it('catch no such table', function (fin) {
    // Drops the table
    testFunctions.dropTable(testConfig, base, entityName)
    .then(function (result) {
      // Gets the Seneca instance
      var oldOption = testConfig.ignore_no_such_table_error
      testConfig.ignore_no_such_table_error = false
      var seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
      var entityFactory = seneca.make(base, entityName)
      var qent = entityFactory.make$({f1: 'v1'})
      moduleRemove.deleteId(testConfig, {q: {id: '007'}, qent: qent})
      .catch(function (err) {
        testConfig.ignore_no_such_table_error = oldOption
        expect(err).to.exist()
        fin()
      })
    })
  })
  // Empty table
  it('empty table', function (fin) {
    // Truncates the table
    testFunctions.truncateTable(testConfig, base, entityName)
    .then(function (result) {
      // Gets the Seneca instance
      var seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
      var entityFactory = seneca.make(base, entityName)
      var qent = entityFactory.make$({f1: 'v1'})
      moduleRemove.remove(testConfig, {q: {}, qent: qent})
      .then(function (result) {
        expect(result).to.not.exist()
        fin()
      })
    })
  })
  // Delete first no there is no such table
  it('first no such table', function (fin) {
    // Drops the table
    testFunctions.dropTable(testConfig, base, entityName)
    .then(function (result) {
      // Gets the Seneca instance
      var seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
      var entityFactory = seneca.make(base, entityName)
      var qent = entityFactory.make$({f1: 'v1'})
      moduleRemove.deleteFirst(testConfig, {q: {}, qent: qent}, [qent])
      .catch(function (err) {
        expect(err).to.exist()
        fin()
      })
    })
  })
  //
})
