/* Copyright (c) 2017 e-soa Jacques Desodt, MIT License */
'use strict'

// Prerequisites
const testConfig = require('./config')
const httpapi = require('../http-api')
const testFunctions = require('./functions')

// Test prerequisites
const Lab = require('lab', {timeout: testFunctions.timeout})
var lab = (exports.lab = Lab.script())
var describe = lab.describe
var it = lab.it

describe('try', function () {
  //
  it('select', function (fin) {
    httpapi.query(testConfig, 'SELECT * FROM foo')
    .then(function (result) {
      console.log('result', result)
      fin()
    })
    .catch(function (err) {
      console.log('err', err)
      fin()
    })
  })
  //
})
