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

describe('remove', function () {
  //
  // Removes without argument
  it('no arg', function (fin) {
    // Gets the Seneca instance
    var seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
    // Removes with ID = null: never calls the plugin
    var entityFactory = seneca.make(base, entityName)
    entityFactory.remove$(null, function (err, result) {
      if (err) { throw err }
      expect(result).to.not.exist()
      fin()
    })
  })
  // No such table: ignores the error
  it('ignore no such table', function (fin) {
    // Drops the table
    testFunctions.dropTable(testConfig, base, entityName)
    .then(function (result) {
      // Gets the Seneca instance
      // Tests with the option: ignore the 'no such table' error
      var oldOption = testConfig.ignore_no_such_table_error
      testConfig.ignore_no_such_table_error = true
      var seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
      // Removes
      var id = '007'
      var entityFactory = seneca.make(base, entityName)
      entityFactory.remove$(id, function (err, result) {
        testConfig.ignore_no_such_table_error = oldOption
        if (err) { throw err }
        expect(result).to.not.exist()
        fin()
      })
    })
  })
  // No such table: catch the error (default)
  it('catch no such table', function (fin) {
    // Drops the table
    testFunctions.dropTable(testConfig, base, entityName)
    .then(function (result) {
      // Gets the Seneca instance
      var oldOption = testConfig.ignore_no_such_table_error
      testConfig.ignore_no_such_table_error = false
      var seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
      // Removes
      var id = '007'
      var entityFactory = seneca.make(base, entityName)
      entityFactory.remove$(id, function (err, result) {
        testConfig.ignore_no_such_table_error = oldOption
        if (err) { throw err }
        expect(result).to.exist()
        expect(result.error.indexOf(testConfig.nosuchtable)).to.not.equal(-1)
        fin()
      })
    })
  })
  // Removes an unknown ID
  it('unknown ID', function (fin) {
    // Truncates the table
    testFunctions.truncateTable(testConfig, base, entityName)
    .then(function (result) {
      // Gets the Seneca instance
      var seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
      // Removes
      var id = '007'
      var entityFactory = seneca.make(base, entityName)
      entityFactory.remove$(id, function (err, result) {
        if (err) { throw err }
        expect(result).to.not.exist()
        fin()
      })
    })
  })
  // Removes a known ID
  it('ID exists', function (fin) {
    // Truncates the table
    testFunctions.truncateTable(testConfig, base, entityName)
    .then(function (result) {
      // Inserts the entity
      var id = '007'
      var entity = {
        id: id,
        firstname: 'John',
        lastname: 'Doo'
      }
      testFunctions.insertEntity(testConfig, base, entityName, entity)
      .then(function (result) {
        // Gets the Seneca instance
        var seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
        // Removes
        var entityFactory = seneca.make(base, entityName)
        entityFactory.remove$(id, function (err, result) {
          if (err) { throw err }
          expect(result).to.not.exist()
          // Checks the empty table
          testFunctions.count(testConfig, base, entityName)
          .then(function (result) {
            expect(result).to.equal(0)
            fin()
          })
        })
      })
    })
  })
  // ID exists and loads the previous version
  it('ID exists and load', function (fin) {
    // Truncates the table
    testFunctions.truncateTable(testConfig, base, entityName)
    .then(function (result) {
      // Inserts the entity
      var id = '007'
      var entity = {
        id: id,
        firstname: 'John',
        lastname: 'Doo'
      }
      testFunctions.insertEntity(testConfig, base, entityName, entity)
      .then(function (result) {
        // Gets the Seneca instance
        var seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
        // Removes
        var entityFactory = seneca.make(base, entityName)
        // The 'load$' option is set
        entityFactory.remove$({id: id, load$: true}, function (err, result) {
          if (err) { throw err }
          expect(result).to.exist()
          expect(result.id).to.equal(id)  // The previous entity
          // Checks the empty table
          testFunctions.count(testConfig, base, entityName)
          .then(function (result) {
            expect(result).to.equal(0)
            fin()
          })
        })
      })
    })
  })
  // Removes all the instances
  it('all', function (fin) {
    // Truncates the table and inserts the entities
    testFunctions.insertList(testConfig, base, entityName)
    .then(function (result) {
      // Gets the Seneca instance
      var seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
      // Removes
      var entityFactory = seneca.make(base, entityName)
      // The 'all$' option is set
      entityFactory.remove$({ all$: true }, function (err, result) {
        if (err) { throw err }
        expect(result).to.not.exist()
        // Checks the empty table
        testFunctions.count(testConfig, base, entityName)
        .then(function (result) {
          expect(result).to.equal(0)
          fin()
        })
      })
    })
  })
  // Removes on an empty table
  it('empty table', function (fin) {
    // Truncates the table
    testFunctions.truncateTable(testConfig, base, entityName)
    .then(function (result) {
      // Gets the Seneca instance
      var seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
      // Removes
      var entityFactory = seneca.make(base, entityName)
      // The 'all$' option is set
      entityFactory.remove$(function (err, result) {
        if (err) { throw err }
        expect(result).to.not.exist()
        fin()
      })
    })
  })
  //
})
