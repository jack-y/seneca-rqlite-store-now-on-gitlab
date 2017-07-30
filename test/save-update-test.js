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

describe('save/update', {timeout: testFunctions.timeout}, function () {
  //
  // Updates in a bad table: ignores the error
  it('ignore no such table', function (fin) {
    // Drops the old table if exists
    testFunctions.dropTable(testConfig, base, entityName)
    .then(function (result) {
      // Gets the Seneca instance
      // Tests with the option: ignore the 'no such table' error
      var oldOption = testConfig.ignore_no_such_table_error
      testConfig.ignore_no_such_table_error = true
      var seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
      // Updates, but the table does not exist: the table is created
      var id = '007'
      var entity = {id: id, width: 360, name: 'mobile'}
      var entityFactory = seneca.make(base, entityName)
      entityFactory.data$(entity)
      entityFactory.save$(function (err, result) {
        testConfig.ignore_no_such_table_error = oldOption
        if (err) { throw err }
        expect(result.id).to.equal(id)
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
  // Updates in a bad table: catchs the error (default)
  it('catch no such table', function (fin) {
    // Drops the old table if exists
    testFunctions.dropTable(testConfig, base, entityName)
    .then(function (result) {
      // Gets the Seneca instance
      var oldOption = testConfig.ignore_no_such_table_error
      testConfig.ignore_no_such_table_error = false
      var seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
      // Updates, but the table does not exist
      var id = '007'
      var entity = {id: id, width: 360, name: 'mobile'}
      var entityFactory = seneca.make(base, entityName)
      entityFactory.data$(entity)
      entityFactory.save$(function (err, result) {
        testConfig.ignore_no_such_table_error = oldOption
        if (err) { throw err }
        expect(result.id).to.not.exist()
        expect(result.error.indexOf(testConfig.nosuchtable)).to.not.equal(-1)
        fin()
      })
    })
  })
  // Updates an entity without data
  it('without data', function (fin) {
    // Truncates the table
    testFunctions.truncateTable(testConfig, base, entityName)
    .then(function (result) {
      // First, inserts the entity in the table
      var id = '007'
      var entity = {id: id, width: 1024, name: 'desktop'}
      testFunctions.insertEntity(testConfig, base, entityName, entity)
      .then(function (result) {
        // Gets the Seneca instance
        var seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
        // Updates the entity without data: only the ID will be written
        var entityFactory = seneca.make(base, entityName)
        entityFactory.data$({id: id})
        entityFactory.save$(function (err, result) {
          if (err) { throw err }
          expect(result.id).to.exist()
          expect(result.width).to.equal(entity.width) // Returns previous version
          // Reads the entity in the table
          testFunctions.readEntity(testConfig, base, entityName, result.id)
          .then(function (readResult) {
            var data = JSON.parse(readResult.results[0].values[0])
            var readEntity = entityFactory.make$(data)
            expect(readEntity.id).to.equal(result.id)
            expect(readResult.width).to.not.exist()
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
  })
  // Updates an entity with its ID unset
  it('ID unset', function (fin) {
    // Truncates the table
    testFunctions.truncateTable(testConfig, base, entityName)
    .then(function (result) {
      // First, inserts the entity in the table
      var id = '007'
      var entity = {id: id, width: 1024, name: 'desktop'}
      testFunctions.insertEntity(testConfig, base, entityName, entity)
      .then(function (result) {
        // Gets the Seneca instance
        var seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
        // ID not set: it will create a new row with a generated ID
        var entityFactory = seneca.make(base, entityName)
        entityFactory.data$({width: 1024, name: 'desktop'})
        entityFactory.save$(function (err, result) {
          if (err) { throw err }
          expect(result.id).to.not.equal(id)
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
              expect(countResult).to.equal(2)
              fin()
            })
          })
        })
      })
    })
  })
  // Updates an entity with its ID set but unknown
  it('ID set and new', function (fin) {
    // Truncates the table
    testFunctions.truncateTable(testConfig, base, entityName)
    .then(function (result) {
      // First, inserts the entity in the table
      var id = '007'
      var entity = {id: id, width: 1024, name: 'desktop'}
      testFunctions.insertEntity(testConfig, base, entityName, entity)
      .then(function (result) {
        // Gets the Seneca instance
        var seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
        // ID set and new: the row will be added
        var newId = '123456'
        var newEntity = {id: newId, width: 1024, name: 'desktop', brand: 'my brand'}
        var entityFactory = seneca.make(base, entityName)
        entityFactory.data$(newEntity)
        entityFactory.save$(function (err, result) {
          if (err) { throw err }
          expect(result.id).to.equal(newId)
          expect(result.width).to.equal(newEntity.width)
          expect(result.brand).to.equal(newEntity.brand)
          // Reads the entity in the table
          testFunctions.readEntity(testConfig, base, entityName, newId)
          .then(function (readResult) {
            var data = JSON.parse(readResult.results[0].values[0])
            var readEntity = entityFactory.make$(data)
            expect(readEntity.id).to.equal(newId)
            expect(readEntity.width).to.equal(newEntity.width)
            // Checks the rows count
            testFunctions.count(testConfig, base, entityName)
            .then(function (countResult) {
              expect(countResult).to.equal(2)
              fin()
            })
          })
        })
      })
    })
  })
  // Updates an entity with its ID set and already exists
  it('ID set and exists', function (fin) {
    // Truncates the table
    testFunctions.truncateTable(testConfig, base, entityName)
    .then(function (result) {
      // First, inserts the entity in the table
      var id = '007'
      var entity = {id: id, width: 1024, name: 'desktop'}
      testFunctions.insertEntity(testConfig, base, entityName, entity)
      .then(function (result) {
        // Gets the Seneca instance
        var seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
        // Updates
        entity = {id: id, width: 360, name: 'mobile'}
        var entityFactory = seneca.make(base, entityName)
        entityFactory.data$(entity)
        entityFactory.save$(function (err, result) {
          if (err) { throw err }
          expect(result.id).to.equal(id)
          expect(result.width).to.equal(360)
          // Reads the entity in the table
          testFunctions.readEntity(testConfig, base, entityName, id)
          .then(function (readResult) {
            var data = JSON.parse(readResult.results[0].values[0])
            var readEntity = entityFactory.make$(data)
            expect(readEntity.id).to.equal(id)
            expect(readEntity.width).to.equal(360)
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
  })
  // Updates an entity with its ID set and already exists + merge option in the entity
  it('ID set and exists + merge in entity', function (fin) {
    // Truncates the table
    testFunctions.truncateTable(testConfig, base, entityName)
    .then(function (result) {
      // First, inserts the entity in the table
      var id = '007'
      var brand = 'my brand'
      var color = 'black'
      var entity = {id: id, width: 1024, name: 'desktop', brand: brand}
      testFunctions.insertEntity(testConfig, base, entityName, entity)
      .then(function (result) {
        // Gets the Seneca instance
        var seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
        // Updates
        entity = {id: id, width: 360, name: 'mobile', color: color}
        // Adds the merge option in the entity
        entity.merge$ = true
        var entityFactory = seneca.make(base, entityName)
        entityFactory.data$(entity)
        entityFactory.save$(function (err, result) {
          if (err) { throw err }
          expect(result.id).to.equal(id)
          expect(result.width).to.equal(360)
          // Reads the entity in the table
          testFunctions.readEntity(testConfig, base, entityName, id)
          .then(function (readResult) {
            var data = JSON.parse(readResult.results[0].values[0])
            var readEntity = entityFactory.make$(data)
            expect(readEntity.id).to.equal(id)
            expect(readEntity.width).to.equal(360)
            expect(readEntity.brand).to.equal(brand)
            expect(readEntity.color).to.equal(color)
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
  })
  // Updates an entity with its ID set and already exists + configuration merge option
  it('ID set and exists + merge in options', function (fin) {
    // Truncates the table
    testFunctions.truncateTable(testConfig, base, entityName)
    .then(function (result) {
      // First, inserts the entity in the table
      var id = '007'
      var brand = 'my brand'
      var color = 'black'
      var entity = {id: id, width: 1024, name: 'desktop', brand: brand}
      testFunctions.insertEntity(testConfig, base, entityName, entity)
      .then(function (result) {
        // Gets the Seneca instance
        testConfig.merge = true
        var seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
        // Updates
        entity = {id: id, width: 360, name: 'mobile', color: color}
        var entityFactory = seneca.make(base, entityName)
        entityFactory.data$(entity)
        entityFactory.save$(function (err, result) {
          if (err) { throw err }
          expect(result.id).to.equal(id)
          expect(result.width).to.equal(360)
          // Reads the entity in the table
          testFunctions.readEntity(testConfig, base, entityName, id)
          .then(function (readResult) {
            var data = JSON.parse(readResult.results[0].values[0])
            var readEntity = entityFactory.make$(data)
            expect(readEntity.id).to.equal(id)
            expect(readEntity.width).to.equal(360)
            expect(readEntity.brand).to.equal(brand)
            expect(readEntity.color).to.equal(color)
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
  })
  //
})
