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

describe('load with filters', {timeout: testFunctions.timeout}, function () {
  //
  // Creates the table and inserts the entities
  it('entities creation', function (fin) {
    testFunctions.insertList(testConfig, base, entityName)
    .then(function (result) {
      fin()
    })
  })
  // Loads without filter
  it('no filter', function (fin) {
    // Gets the Seneca instance
    var seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
    // Loads
    var entityFactory = seneca.make(base, entityName)
    entityFactory.load$(function (err, result) {
      if (err) { throw err }
      expect(result).to.not.exist()
      fin()
    })
  })
  // The ID is in the factory entity
  it('ID in entity', function (fin) {
    // Gets the Seneca instance
    var seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
    var entityFactory = seneca.make(base, entityName)
    var id = '007'
    entityFactory.id = id
    // Loads
    entityFactory.load$(function (err, result) {
      if (err) { throw err }
      expect(result).to.exist()
      expect(result.id).to.equal(id)
      fin()
    })
  })
  // Filters on the ID
  it('filter on ID', function (fin) {
    // Gets the Seneca instance
    var seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
    var id = '007'
    var entityFactory = seneca.make(base, entityName)
    // Loads
    entityFactory.load$({id: id}, function (err, result) {
      if (err) { throw err }
      expect(result).to.exist()
      expect(result.id).to.equal(id)
      fin()
    })
  })
  // Filters on a numeric value
  it('filter on numeric value', function (fin) {
    // Gets the Seneca instance
    var seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
    var age = 31
    var entityFactory = seneca.make(base, entityName)
    // Loads
    entityFactory.load$({age: age}, function (err, result) {
      if (err) { throw err }
      expect(result).to.exist()
      expect(result.id).to.equal('005')
      fin()
    })
  })
  // Filters on a string value
  it('filter on string value', function (fin) {
    // Gets the Seneca instance
    var seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
    var name = 'John'
    var entityFactory = seneca.make(base, entityName)
    // Loads
    entityFactory.load$({name: name}, function (err, result) {
      if (err) { throw err }
      expect(result).to.exist()
      expect(result.id).to.equal('001')
      fin()
    })
  })
  // Multiples filters
  it('multiples filters', function (fin) {
    // Gets the Seneca instance
    var seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
    var name = 'William'
    var age = 31
    var entityFactory = seneca.make(base, entityName)
    // Loads
    entityFactory.load$({name: name, age: age}, function (err, result) {
      if (err) { throw err }
      expect(result).to.exist()
      expect(result.id).to.equal('007')
      fin()
    })
  })
  //
})
