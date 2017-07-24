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

describe('list on IDs', function () {
  //
  // Creates the table and inserts the entities
  it('entities creation', function (fin) {
    testFunctions.insertList(testConfig, base, entityName)
    .then(function (result) {
      fin()
    })
  })
  // Lists on one ID
  it('one ID', function (fin) {
    // Gets the Seneca instance
    var seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
    // List
    var id = '004'
    var entityFactory = seneca.make(base, entityName)
    entityFactory.list$(id, function (err, result) {
      if (err) { throw err }
      expect(result).to.exist()
      expect(result.length).to.equal(1)
      expect(result[0].id).to.equal(id)
      expect(result[0].age).to.equal(15)
      fin()
    })
  })
  // Lists on one unknown ID
  it('unknown ID', function (fin) {
    // Gets the Seneca instance
    var seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
    // List
    var id = 'tes"t'
    var entityFactory = seneca.make(base, entityName)
    entityFactory.list$(id, function (err, result) {
      if (err) { throw err }
      expect(result).to.exist()
      expect(result.length).to.equal(0)
      fin()
    })
  })
  // Lists by an array of IDs
  it('array of IDs', function (fin) {
    // Gets the Seneca instance
    var seneca = testFunctions.setSeneca(Seneca, testConfig, role, fin) // Add 'print' for debug
    // List: one of the IDs is unknown
    var ids = ['006', '003', '56"7', '009']
    var entityFactory = seneca.make(base, entityName)
    entityFactory.list$(ids, function (err, result) {
      if (err) { throw err }
      expect(result).to.exist()
      expect(result.length).to.equal(3)
      fin()
    })
  })
  //
})
