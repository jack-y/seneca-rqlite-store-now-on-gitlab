/* Copyright (c) 2017 e-soa Jacques Desodt, MIT License */
'use strict'

/**
 * TESTS DIRECTLY ON THE MODULE
**/

// Prerequisites
const moduleSave = require('../module-save')
const testFunctions = require('./functions')

// Test prerequisites
const Code = require('code')
const Lab = require('lab')
var lab = (exports.lab = Lab.script())
var describe = lab.describe
var it = lab.it
var expect = Code.expect

describe('module save', {timeout: testFunctions.timeout}, function () {
  //
  // Bad argument
  it('no arg', function (fin) {
    moduleSave.save(null, {})
    .catch(function (err) {
      expect(err).to.exist()
      fin()
    })
  })
  //
})
