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

describe('list with filters', {timeout: testFunctions.timeout}, function () {
  //
  // Creates the table and insert the entities
  it('entities creation', function (fin) {
    testFunctions.insertList(testConfig, base, entityName)
    .then(function (result) {
      fin()
    })
  })
  // List all
  it('all', function (fin) {
    // Gets the Seneca instance
    var seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
    // List all
    var entityFactory = seneca.make(base, entityName)
    entityFactory.list$(function (err, result) {
      if (err) { throw err }
      expect(result).to.exist()
      expect(result.length).to.equal(9)
      for (var i = 0; i < 9; i++) {
        expect(result[i].id).to.equal('00' + (i + 1))
      }
      fin()
    })
  })
  // Filter on ID
  it('filter on ID', function (fin) {
    // Gets the Seneca instance
    var seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
    // List one ID
    var id = '007'
    var entityFactory = seneca.make(base, entityName)
    entityFactory.list$({id: id}, function (err, result) {
      if (err) { throw err }
      expect(result).to.exist()
      expect(result.length).to.equal(1)
      expect(result[0].id).to.equal(id)
      fin()
    })
  })
  // Filters on a numeric value
  it('filter on numeric value', function (fin) {
    // Gets the Seneca instance
    var seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
    // List on numeric age
    var age = 31
    var entityFactory = seneca.make(base, entityName)
    entityFactory.list$({age: age}, function (err, result) {
      if (err) { throw err }
      expect(result).to.exist()
      expect(result.length).to.equal(3)
      expect(result[0].id).to.equal('005')
      fin()
    })
  })
  // Filters on a string value
  it('filter on string value', function (fin) {
    // Gets the Seneca instance
    var seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
    // List on a string value
    var name = 'John'
    var entityFactory = seneca.make(base, entityName)
    entityFactory.list$({name: name}, function (err, result) {
      if (err) { throw err }
      expect(result).to.exist()
      expect(result.length).to.equal(6)
      expect(result[5].id).to.equal('006')
      fin()
    })
  })
  // Multiples filters
  it('multiples filters', function (fin) {
    // Gets the Seneca instance
    var seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
    // List on multiple filters
    var name = 'John'
    var age = 31
    var entityFactory = seneca.make(base, entityName)
    entityFactory.list$({name: name, age: age}, function (err, result) {
      if (err) { throw err }
      expect(result).to.exist()
      expect(result.length).to.equal(1)
      expect(result[0].id).to.equal('005')
      fin()
    })
  })
  // Bad native$ SQL statement
  it('bad native$ statement', function (fin) {
    // Gets the Seneca instance
    var seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
    // Bad SQL (the table schema: id, json)
    var sql = 'SELECT * FROM ' + entityName + ' WHERE age < 25'
    var entityFactory = seneca.make(base, entityName)
    entityFactory.list$({native$: sql}, function (err, result) {
      if (err) { throw err }
      expect(result.error).to.exist()
      fin()
    })
  })
  // Native$ SQL statement with results
  it('native$ with results', function (fin) {
    // Gets the Seneca instance
    var seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
    // SQL (the table schema: id, json)
    var sql = 'SELECT json FROM ' + entityName + ' WHERE json LIKE "%William%"'
    var entityFactory = seneca.make(base, entityName)
    entityFactory.list$({native$: sql}, function (err, result) {
      if (err) { throw err }
      expect(result).to.exist()
      expect(result.length).to.equal(3)
      fin()
    })
  })
  //
})
