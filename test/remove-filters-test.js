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

describe('remove with filters', {timeout: testFunctions.timeout}, function () {
  //
  // Creates the table and insert the entities
  it('entities creation', function (fin) {
    testFunctions.insertList(testConfig, base, entityName)
    .then(function (result) {
      fin()
    })
  })
  // Removes without filter: the first row is deleted
  it('no filter', function (fin) {
    // Gets the Seneca instance
    var seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
    // Removes
    var entityFactory = seneca.make(base, entityName)
    entityFactory.remove$({}, function (err, result) {
      if (err) { throw err }
      expect(result).to.not.exist()
      // Checks the rows count
      testFunctions.count(testConfig, base, entityName)
      .then(function (result) {
        expect(result).to.equal(8)
        fin()
      })
    })
  })
  // Filters on a numeric value
  it('filter on numeric value', function (fin) {
    // Gets the Seneca instance
    var seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
    // Removes
    var age = 31
    var entityFactory = seneca.make(base, entityName)
    entityFactory.remove$({age: age}, function (err, result) {
      if (err) { throw err }
      expect(result).to.not.exist()
      // Checks the rows count
      testFunctions.count(testConfig, base, entityName)
      .then(function (result) {
        expect(result).to.equal(7)
        fin()
      })
    })
  })
  // Filters on a string value
  it('filter on string value', function (fin) {
    // Gets the Seneca instance
    var seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
    // Removes
    var name = 'William'
    var entityFactory = seneca.make(base, entityName)
    entityFactory.remove$({name: name}, function (err, result) {
      if (err) { throw err }
      expect(result).to.not.exist()
      // Checks the rows count
      testFunctions.count(testConfig, base, entityName)
      .then(function (result) {
        expect(result).to.equal(6)
        fin()
      })
    })
  })
  // Multiples filters
  it('multiples filters', function (fin) {
    // Gets the Seneca instance
    var seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
    // Removes
    var name = 'William'
    var age = 31
    var entityFactory = seneca.make(base, entityName)
    entityFactory.remove$({name: name, age: age}, function (err, result) {
      if (err) { throw err }
      expect(result).to.not.exist()
      // Checks the rows count
      testFunctions.count(testConfig, base, entityName)
      .then(function (result) {
        expect(result).to.equal(5)
        fin()
      })
    })
  })
  // Multiples filters and loads the previous version
  it('multiples filters and load', function (fin) {
    // Gets the Seneca instance
    var seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
    // Removes
    var name = 'John'
    var age = 15
    var entityFactory = seneca.make(base, entityName)
    // The 'load$' option is set
    entityFactory.remove$({name: name, age: age, load$: true}, function (err, result) {
      if (err) { throw err }
      expect(result).to.exist()
      expect(result.id).to.equal('004') // The previous entity
      // Checks the rows count
      testFunctions.count(testConfig, base, entityName)
      .then(function (result) {
        expect(result).to.equal(4)
        fin()
      })
    })
  })
  // Filters but no data in the table
  it('filters but no data', function (fin) {
    // Truncates the table
    testFunctions.truncateTable(testConfig, base, entityName)
    .then(function (result) {
      // Gets the Seneca instance
      var seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
      // Removes
      var name = 'John'
      var age = 15
      var entityFactory = seneca.make(base, entityName)
      // The 'load$' option is set
      entityFactory.remove$({name: name, age: age}, function (err, result) {
        if (err) { throw err }
        expect(result).to.not.exist()
        fin()
      })
    })
  })
  //
})
