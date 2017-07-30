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

describe('native', {timeout: testFunctions.timeout}, function () {
  //
  // Gets the HTTP API
  it('get http api', function (fin) {
    // Gets the Seneca instance
    var seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
    // Calls the native function: the HTTP API must be returned
    var entityFactory = seneca.make(base, entityName)
    entityFactory.native$(function (err, httpapi) {
      if (err) { throw err }
      expect(httpapi).to.exist()
      expect(httpapi.execute).to.exist()
      expect(httpapi.executeTransaction).to.exist()
      expect(httpapi.query).to.exist()
      fin()
    })
  })
  // Executes a statement
  it('execute', function (fin) {
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
        // Sets the table name
        var tablename = testFunctions.getTableName(base, entityName)
        // Updates the lastname
        var updateLastname = 'Bond'
        var updateEntity = {
          id: id,
          firstname: entity.firstname,
          lastname: updateLastname
        }
        var sql = 'UPDATE ' + tablename +
          ' SET json = "' + JSON.stringify(updateEntity).replace(/"/g, '""') +
          '" WHERE id = "' + id + '"'
        var entityFactory = seneca.make(base, entityName)
        entityFactory.native$(function (err, httpapi) {
          if (err) { throw err }
          // Executes the SQL statement using the HTTP API
          httpapi.execute(testConfig, sql)
          .then(function (result) {
            // Checks if the entity is updated
            testFunctions.readEntity(testConfig, base, entityName, id)
            .then(function (readResult) {
              var data = JSON.parse(readResult.results[0].values[0])
              var readEntity = entityFactory.make$(data)
              expect(readEntity.lastname).to.equal(updateLastname)
              fin()
            })
          })
        })
      })
    })
  })
  // Queries some data
  it('query', function (fin) {
    // Creates the table and inserts the entities
    testFunctions.insertList(testConfig, base, entityName)
    .then(function (result) {
      // Gets the Seneca instance
      var seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
      // Sets the table name
      var tablename = testFunctions.getTableName(base, entityName)
      // Sets the query
      var sql = 'SELECT json FROM ' + tablename +
        ' WHERE id = "002" OR instr(json, \'"name":"William"\')'
      var entityFactory = seneca.make(base, entityName)
      entityFactory.native$(function (err, httpapi) {
        if (err) { throw err }
        // Executes the query using the HTTP API
        httpapi.query(testConfig, sql)
        .then(function (result) {
          // Checks the result
          expect(result).to.exist()
          expect(result.length).to.equal(4)
          fin()
        })
      })
    })
  })
  //
})
