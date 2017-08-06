/* Copyright (c) 2017 e-soa Jacques Desodt, MIT License */
'use strict'

// Prerequisites
const queryUtils = require('../query-utils')
const testFunctions = require('./functions')

// Test prerequisites
const Code = require('code')
const Lab = require('lab', {timeout: testFunctions.timeout})
const lab = (exports.lab = Lab.script())
const describe = lab.describe
const it = lab.it
const expect = Code.expect

describe('query utils', {timeout: testFunctions.timeout}, function () {
  // No arg
  it('get query without arg', function (fin) {
    var sql = queryUtils.getQueryWhere({})
    expect(sql).to.equal('')
    fin()
  })
  //
  it('get query native', function (fin) {
    const nativeSql = 'select * from foo'
    var sql = queryUtils.getQueryWhere({q: {native$: nativeSql}})
    expect(sql).to.equal(nativeSql)
    fin()
  })
  //
  it('do fields$ no arg', function (fin) {
    var list = [
      {f1: 'v1', f2: 'v2'},
      {f1: 'z1', f2: 'z2'}
    ]
    var query = {}
    var result = queryUtils.doFields(list, query)
    expect(result.length).to.equal(list.length)
    expect(Object.keys(result[0]).length).to.equal(2)
    fin()
  })
  // Fields$ empty
  it('do fields$ empty', function (fin) {
    var list = [
      {f1: 'v1', f2: 'v2'},
      {f1: 'z1', f2: 'z2'}
    ]
    var query = {fields$: []}
    var result = queryUtils.doFields(list, query)
    expect(result.length).to.equal(list.length)
    expect(Object.keys(result[0]).length).to.equal(2)
    fin()
  })
  // Fields$ result
  it('do fields$ with selection', function (fin) {
    var list = [
      {f1: 'v1', f2: 'v2'},
      {f1: 'z1', f2: 'z2'}
    ]
    var query = {fields$: ['f2']}
    var result = queryUtils.doFields(list, query)
    expect(result.length).to.equal(list.length)
    expect(result[0].f1).to.not.exist()
    fin()
  })
  // Sort$ with equality
  it('do sort$ with equality', function (fin) {
    var list = [
      {f1: 'z1', f2: 'z2'},
      {f1: 'w1', f2: 'v2'},
      {f1: 'v1', f2: 'v2'}
    ]
    var query = {sort$: {'f2': 1}}
    var result = queryUtils.doSort(list, query)
    expect(result.length).to.equal(list.length)
    expect(result[0].f1).to.equal('w1')
    fin()
  })
  // Escapes string
  it('escape string', function (fin) {
    var input = '\0\x08\x09\b\t\x1a\n\r %'
    var result = queryUtils.escapeStr(input)
    expect(result).to.equal('\\0\\b\\t\\b\\t\\z\\n\\r \\%')
    fin()
  })
  //
})
