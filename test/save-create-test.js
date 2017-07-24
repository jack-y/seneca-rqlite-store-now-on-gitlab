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

describe('save/create', function () {
  //
  // Creates in a bad table: ignores the error
  it('ignore no such table', function (fin) {
    // Drops the old table if exists
    testFunctions.dropTable(testConfig, base, entityName)
    .then(function (result) {
      // Gets the Seneca instance
      // Tests with the option: ignore the 'no such table' error
      var oldOption = testConfig.ignore_no_such_table_error
      testConfig.ignore_no_such_table_error = true
      var seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
      // Creates, but the table does not exist: the table is created
      var entityFactory = seneca.make(base, entityName)
      entityFactory.save$(function (err, result) {
        testConfig.ignore_no_such_table_error = oldOption
        if (err) { throw err }
        expect(result.id).to.exist()
        // Reads the entity in the table
        testFunctions.readEntity(testConfig, base, entityName, result.id)
        .then(function (readResult) {
          var data = JSON.parse(readResult.results[0].values[0])
          var readEntity = entityFactory.make$(data)
          expect(readEntity.id).to.equal(result.id)
          // Checks the rows count
          testFunctions.count(testConfig, base, entityName)
          .then(function (countResult) {
            expect(countResult).to.equal(1)
            fin()
          })
        })
      })
    })
  })
  // Creates in a bad table: catch the error (default)
  it('catch no such table', function (fin) {
    // Drops the old table if exists
    testFunctions.dropTable(testConfig, base, entityName)
    .then(function (result) {
      // Gets the Seneca instance
      var oldOption = testConfig.ignore_no_such_table_error
      testConfig.ignore_no_such_table_error = false
      var seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
      // Creates, but the table does not exist
      var entityFactory = seneca.make(base, entityName)
      entityFactory.save$(function (err, result) {
        testConfig.ignore_no_such_table_error = oldOption
        if (err) { throw err }
        expect(result.id).to.not.exist()
        expect(result.error.indexOf(testConfig.nosuchtable)).to.not.equal(-1)
        fin()
      })
    })
  })
  // Creates an entity without data
  it('without data', function (fin) {
    // Truncates the table
    testFunctions.truncateTable(testConfig, base, entityName)
    .then(function (result) {
      // Gets the Seneca instance
      var seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
      // Creates an entity without data: only the ID will be written
      var entityFactory = seneca.make(base, entityName)
      entityFactory.save$(function (err, result) {
        if (err) { throw err }
        expect(result.id).to.exist()
        // Reads the entity in the table
        testFunctions.readEntity(testConfig, base, entityName, result.id)
        .then(function (readResult) {
          var data = JSON.parse(readResult.results[0].values[0])
          var readEntity = entityFactory.make$(data)
          expect(readEntity.id).to.equal(result.id)
          // Checks the rows count
          testFunctions.count(testConfig, base, entityName)
          .then(function (countResult) {
            expect(countResult).to.equal(1)
            fin()
          })
        })
      })
    })
  })
  // Creates an entity without ID
  it('without ID', function (fin) {
    // Truncates the table
    testFunctions.truncateTable(testConfig, base, entityName)
    .then(function (result) {
      // Gets the Seneca instance
      var seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
      // Creates without ID: it will be generated
      var entity = {width: 1024, name: 'desktop'}
      var entityFactory = seneca.make(base, entityName)
      entityFactory.data$(entity)
      entityFactory.save$(function (err, result) {
        if (err) { throw err }
        expect(result.id).to.exist()
        // Reads the entity in the table
        testFunctions.readEntity(testConfig, base, entityName, result.id)
        .then(function (readResult) {
          var data = JSON.parse(readResult.results[0].values[0])
          var readEntity = entityFactory.make$(data)
          expect(readEntity.id).to.equal(result.id)
          expect(readEntity.width).to.equal(entity.width)
          // Checks the rows count
          testFunctions.count(testConfig, base, entityName)
          .then(function (countResult) {
            expect(countResult).to.equal(1)
            fin()
          })
        })
      })
    })
  })
  // Creates an entity with its ID set but unknown
  it('ID set and new', function (fin) {
    // Truncates the table
    testFunctions.truncateTable(testConfig, base, entityName)
    .then(function (result) {
      // Gets the Seneca instance
      var seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
      // The table is empty: creates with the ID set and new
      var id = '007'
      var entity = {id: id, width: 1024, name: 'desktop'}
      var entityFactory = seneca.make(base, entityName)
      entityFactory.data$(entity)
      entityFactory.save$(function (err, result) {
        if (err) { throw err }
        expect(result.id).to.exist()
        expect(result.width).to.equal(entity.width)
        // Reads the entity in the table
        testFunctions.readEntity(testConfig, base, entityName, result.id)
        .then(function (readResult) {
          var data = JSON.parse(readResult.results[0].values[0])
          var readEntity = entityFactory.make$(data)
          expect(readEntity.id).to.equal(result.id)
          expect(readEntity.width).to.equal(entity.width)
          // Checks the rows count
          testFunctions.count(testConfig, base, entityName)
          .then(function (countResult) {
            expect(countResult).to.equal(1)
            fin()
          })
        })
      })
    })
  })
  // Creates an entity with its ID set and already exists
  it('ID set and exists', function (fin) {
    // Truncates the table
    testFunctions.truncateTable(testConfig, base, entityName)
    .then(function (result) {
      // Gets the Seneca instance
      var seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
      // Creates with the ID set
      var id = '007'
      var entity = {id: id, width: 360, name: 'mobile'}
      testFunctions.insertEntity(testConfig, base, entityName, entity)
      .then(function (result) {
        // Creates once again with the same ID: an error occurs
        var anotherEntity = {id$: id, firstname: 'John', lastname: 'Doo'}
        var entityFactory = seneca.make(base, entityName)
        entityFactory.data$(anotherEntity)
        entityFactory.save$(function (err, result) {
          if (err) { throw err }
          expect(result.id).to.not.exist()
          expect(result.error).to.exist()
          expect(result.error.indexOf(testConfig.unique)).to.not.equal(-1)
          fin()
        })
      })
    })
  })
  //
})
