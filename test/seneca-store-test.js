/* Copyright (c) 2017 e-soa Jacques Desodt, MIT License */
'use strict'

/**
 * TESTS with the seneca-store-test plugin
 * It is used to verify that a store meets the minimum requirements
 * needed for the Seneca data message patterns.
 * See: https://github.com/senecajs/seneca-store-test
 *
 * Note: Native SQL list is not supported because of the JSON format
 * in the tables.
**/

// Default plugin options
const pluginName = 'rqlite-store'
const role = pluginName + '-test'

// Prerequisites
const testConfig = require('./config')
const Seneca = require('seneca')
const Shared = require('seneca-store-test')
const testFunctions = require('./functions')
const _ = require('lodash')

// Test prerequisites
const Lab = require('lab', {timeout: testFunctions.timeout})
const lab = (exports.lab = Lab.script())
const describe = lab.describe
const it = lab.it

describe('seneca store', {timeout: testFunctions.timeout}, function () {
  //
  it('basic', function (fin) {
    // Gets the Seneca instances
    var testConfigMerge = _.cloneDeep(testConfig)
    testConfigMerge.merge = false
    var seneca = testFunctions.setSenecaBasic(Seneca, testConfig, role, fin) // Add 'print' for debug
    var senecaMerge = testFunctions.setSenecaBasic(Seneca, testConfigMerge, role, fin) // Add 'print' for debug
    // Runs all the basic tests
    Shared.basictest({
      seneca: seneca,
      senecaMerge: senecaMerge,
      script: lab
    })
    // Runs the tests based on the limit filter
    Shared.limitstest({
      seneca: seneca,
      script: lab
    })
    // Runs the tests based on the sort filter
    Shared.sorttest({
      seneca: seneca,
      script: lab
    })
    // Native SQL tests are not supported because of the JSON format
    // in the tables (Document Databases)
    // Please Use the native-test.js script instead.
    // Shared.sqltest()
    fin()
  })
  //
})
