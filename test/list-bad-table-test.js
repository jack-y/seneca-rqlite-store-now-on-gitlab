/* Copyright (c) 2017 e-soa Jacques Desodt, MIT License */
'use strict'

// Default plugin options
const pluginName = 'rqlite-store'
const role = pluginName + '-test'
const base = null
const entityName = 'test'

// Prerequisites
const testConfig = require('./config')
const Seneca = require('seneca')
const testFunctions = require('./functions')

// Test prerequisites
const Code = require('code')
const Lab = require('lab', {timeout: testFunctions.timeout})
var lab = (exports.lab = Lab.script())
var describe = lab.describe
var it = lab.it
var expect = Code.expect

describe('list on bad table', function () {
  //
  // No such table: ignore the error
  it('ignore', function (fin) {
    // Drops the table
    testFunctions.dropTable(testConfig, base, entityName)
    .then(function (result) {
      // Gets the Seneca instance
      // Tests with the option: ignore the 'no such table' error
      var oldOption = testConfig.ignore_no_such_table_error
      testConfig.ignore_no_such_table_error = true
      var seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
      // Gets an empty list
      var entityFactory = seneca.make(base, entityName)
      entityFactory.list$(function (err, result) {
        testConfig.ignore_no_such_table_error = oldOption
        if (err) { throw err }
        expect(result.length).to.equal(0)
        expect(result.error).to.not.exist()
        fin()
      })
    })
  })
  // No such table: ignore the error
  it('ignore and multiple filters', function (fin) {
    // Drops the table
    testFunctions.dropTable(testConfig, base, entityName)
    .then(function (result) {
      // Gets the Seneca instance
      // Tests with the option: ignore the 'no such table' error
      var oldOption = testConfig.ignore_no_such_table_error
      testConfig.ignore_no_such_table_error = true
      var seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
      // Gets an empty list
      var entityFactory = seneca.make(base, entityName)
      entityFactory.list$({name: 'John', age: 31}, function (err, result) {
        testConfig.ignore_no_such_table_error = oldOption
        if (err) { throw err }
        expect(result.length).to.equal(0)
        expect(result.error).to.not.exist()
        fin()
      })
    })
  })
  // No such table: catch the error (default)
  it('catch', function (fin) {
    // Drops table
    testFunctions.dropTable(testConfig, base, entityName)
    .then(function (result) {
      // Gets the Seneca instance
      var oldOption = testConfig.ignore_no_such_table_error
      testConfig.ignore_no_such_table_error = false
      var seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
      var entityFactory = seneca.make(base, entityName)
      entityFactory.list$(function (err, result) {
        testConfig.ignore_no_such_table_error = oldOption
        if (err) { throw err }
        // The result must contain the error
        expect(result.error.indexOf(testConfig.nosuchtable)).to.not.equal(-1)
        fin()
      })
    })
  })
  // No such table: catch the error (default)
  it('catch and multiple filters', function (fin) {
    // Drops table
    testFunctions.dropTable(testConfig, base, entityName)
    .then(function (result) {
      // Gets the Seneca instance
      var oldOption = testConfig.ignore_no_such_table_error
      testConfig.ignore_no_such_table_error = false
      var seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
      var entityFactory = seneca.make(base, entityName)
      entityFactory.list$({name: 'John', age: 31}, function (err, result) {
        testConfig.ignore_no_such_table_error = oldOption
        if (err) { throw err }
        // The result must contain the error
        expect(result.error.indexOf(testConfig.nosuchtable)).to.not.equal(-1)
        fin()
      })
    })
  })
  //
})
