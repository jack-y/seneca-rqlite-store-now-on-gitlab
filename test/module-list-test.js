/* Copyright (c) 2017 e-soa Jacques Desodt, MIT License */
'use strict'

/**
 * TESTS DIRECTLY ON THE MODULE
**/

// Prerequisites
const moduleList = require('../module-list')

// Test prerequisites
const Code = require('code')
const Lab = require('lab')
var lab = (exports.lab = Lab.script())
var describe = lab.describe
var it = lab.it
var expect = Code.expect

describe('module list', function () {
  //
  // Bad argument
  it('no arg', function (fin) {
    moduleList.list(null, {})
    .catch(function (err) {
      expect(err).to.exist()
      fin()
    })
  })
  //
})
