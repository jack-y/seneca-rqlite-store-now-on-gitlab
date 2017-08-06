/* Copyright (c) 2017 e-soa Jacques Desodt, MIT License */
'use strict'

// Prerequisites
const discoclient = require('../disco-client')
const events = require('events')
const requester = require('../requester')
const testFunctions = require('./functions')

// Test prerequisites
const Code = require('code')
const Lab = require('lab', {timeout: testFunctions.timeout})
const lab = (exports.lab = Lab.script())
const describe = lab.describe
const it = lab.it
const expect = Code.expect

const errMsg = 'ko'
// Mocks the discovery client
const requestCurrent = discoclient.request
// Mocks the requester
const processResponseCurrent = requester.processResponse
const getCurrent = requester.get
const postCurrent = requester.post

// Mocks the HTTP response
var response = new events.EventEmitter()
response.setEncoding = function (e) {}
response.headers = {location: 'http://httpstat.us:80'}

describe('requester request', {timeout: testFunctions.timeout}, function () {
  //
  // HTTP
  it('http 404', function (fin) {
    const options = {
      protocol: 'http',
      host: 'httpstat.us',
      port: 80,
      timeout: 2000,
      path: '/404',
      postData: ''
    }
    requester.request(options)
    .catch(function (err) {
      expect(err.status).to.equal(404)
      expect(err.error.indexOf('on error') > -1).to.equal(true)
      fin()
    })
  })
  //
  it('https 404', function (fin) {
    const options = {
      protocol: 'https',
      host: 'www.google.com',
      port: 443,
      timeout: 2000,
      path: '/bad/path',
      postData: ''
    }
    requester.request(options)
    .catch(function (err) {
      expect(err.status).to.equal(404)
      expect(err.error.indexOf('on error') > -1).to.equal(true)
      fin()
    })
  })
  // Timeout
  it('timeout no discovery', function (fin) {
    const options = {
      protocol: 'http',
      host: 'httpstat.us',
      port: 80,
      timeout: 400,
      path: '/200?sleep=500',
      postData: ''
    }
    requester.request(options)
    .catch(function (err) {
      expect(err.error.message.indexOf('socket hang up') > -1).to.equal(true)
      fin()
    })
  })
  //
  it('timeout and discovery on error', function (fin) {
    // Mocks the discovery function
    discoclient.request = function (options) {
      return new Promise(function (resolve, reject) {
        return reject(new Error(errMsg))
      })
    }
    const options = {
      protocol: 'http',
      host: 'httpstat.us',
      port: 80,
      timeout: 400,
      path: '/200?sleep=500',
      postData: '',
      disco_url: 'http://httpstat.us/200'
    }
    requester.request(options)
    .catch(function (err) {
      discoclient.request = requestCurrent
      expect(err.message).to.equal(errMsg)
      fin()
    })
  })
  //
  it('timeout and discovery ok', function (fin) {
    // Mocks the discovery function
    discoclient.request = function (options) {
      return new Promise(function (resolve, reject) {
        return resolve({success: true})
      })
    }
    const options = {
      protocol: 'http',
      host: 'httpstat.us',
      port: 80,
      timeout: 400,
      path: '/200?sleep=500',
      postData: '',
      disco_url: 'http://httpstat.us/200'
    }
    requester.request(options)
    .then(function (result) {
      discoclient.request = requestCurrent
      expect(result.success).to.equal(true)
      fin()
    })
  })
  // Request OK
  it('request ok and processResponse on error', function (fin) {
    // Mocks the requester
    requester.processResponse = function (options) {
      return new Promise(function (resolve, reject) {
        return reject(new Error(errMsg))
      })
    }
    const options = {
      protocol: 'http:',
      host: 'httpstat.us',
      port: 80,
      timeout: 4000,
      path: '/200',
      postData: '',
      disco_url: 'http://httpstat.us/200'
    }
    requester.request(options)
    .catch(function (err) {
      requester.processResponse = processResponseCurrent
      expect(err.message).to.equal(errMsg)
      fin()
    })
  })
  //
  it('request ok and processResponse ok', function (fin) {
    // Mocks the requester
    requester.processResponse = function (options) {
      return new Promise(function (resolve, reject) {
        return resolve({success: true})
      })
    }
    const options = {
      protocol: 'http',
      host: 'httpstat.us',
      port: 80,
      timeout: 4000,
      path: '/200',
      postData: '',
      disco_url: 'http://httpstat.us/200'
    }
    requester.request(options)
    .then(function (result) {
      requester.processResponse = processResponseCurrent
      expect(result.success).to.equal(true)
      fin()
    })
  })
  // process response
  it('processResponse: error 404', function (fin) {
    response.statusCode = 404
    const options = {
      timeout: 4000
    }
    requester.processResponse(options, response)
    .catch(function (err) {
      expect(err.status).to.equal(response.statusCode)
      expect(err.error.indexOf('Request on error') > -1).to.equal(true)
      fin()
    })
  })
  //
  it('processResponse: redirect but max reached', function (fin) {
    response.statusCode = 301
    const options = {
      timeout: 4000,
      toomuchredirects: 'too much redirects',
      redirects: 2,
      maxredirects: 2
    }
    requester.processResponse(options, response)
    .catch(function (err) {
      expect(err.status).to.equal(response.statusCode)
      expect(err.error).to.equal(options.toomuchredirects)
      fin()
    })
  })
  //
  it('processResponse: redirect and get on error', function (fin) {
    // Mocks the requester
    requester.get = function (options, path) {
      return new Promise(function (resolve, reject) {
        return reject(new Error(errMsg))
      })
    }
    //
    response.statusCode = 301
    const baseRedirects = 0
    var options = {
      timeout: 4000,
      redirects: baseRedirects,
      maxredirects: 2,
      method: 'GET',
      path: ''
    }
    requester.processResponse(options, response)
    .catch(function (err) {
      requester.get = getCurrent
      expect(options.redirects).to.equal(baseRedirects + 1)
      expect(err.message).to.equal(errMsg)
      fin()
    })
  })
  //
  it('processResponse: redirect and get ok', function (fin) {
    // Mocks the requester
    requester.get = function (options, path) {
      return new Promise(function (resolve, reject) {
        return resolve({success: true})
      })
    }
    //
    response.statusCode = 301
    const baseRedirects = 0
    var options = {
      timeout: 4000,
      redirects: baseRedirects,
      maxredirects: 2,
      method: 'GET',
      path: ''
    }
    requester.processResponse(options, response)
    .then(function (result) {
      requester.get = getCurrent
      expect(options.redirects).to.equal(baseRedirects + 1)
      expect(result.success).to.equal(true)
      fin()
    })
  })
  //
  it('processResponse: redirect and post on error', function (fin) {
    // Mocks the requester
    requester.post = function (options, path, data) {
      return new Promise(function (resolve, reject) {
        return reject(new Error(errMsg))
      })
    }
    //
    response.statusCode = 301
    const baseRedirects = 0
    var options = {
      timeout: 4000,
      redirects: baseRedirects,
      maxredirects: 2,
      method: 'POST',
      path: '',
      data: {}
    }
    requester.processResponse(options, response)
    .catch(function (err) {
      requester.post = postCurrent
      expect(options.redirects).to.equal(baseRedirects + 1)
      expect(err.message).to.equal(errMsg)
      fin()
    })
  })
  //
  it('processResponse: redirect and post ok', function (fin) {
    // Mocks the requester
    requester.post = function (options, path, data) {
      return new Promise(function (resolve, reject) {
        return resolve({success: true})
      })
    }
    //
    response.statusCode = 301
    const baseRedirects = 0
    var options = {
      timeout: 4000,
      redirects: baseRedirects,
      maxredirects: 2,
      method: 'POST',
      path: ''
    }
    requester.processResponse(options, response)
    .then(function (result) {
      requester.post = postCurrent
      expect(options.redirects).to.equal(baseRedirects + 1)
      expect(result.success).to.equal(true)
      fin()
    })
  })
  // Extra options
  it('extra options: no redirect and no keepalive', function (fin) {
    const options = {}
    const extra = requester.setExtraOptions(options)
    expect(extra.redirects).to.equal(0)
    expect(extra.rejectUnauthorized).to.equal(false)
    expect(extra.agent).to.not.exist()
    fin()
  })
  //
  it('extra options: redirect and keepalive http', function (fin) {
    const options = {
      protocol: 'http',
      keepalive: true,
      redirects: 4
    }
    const extra = requester.setExtraOptions(options)
    expect(extra.redirects).to.equal(options.redirects)
    expect(extra.agent.protocol).to.equal('http:')
    fin()
  })
  //
  it('extra options: keepalive https', function (fin) {
    const options = {
      protocol: 'https',
      keepalive: true
    }
    const extra = requester.setExtraOptions(options)
    expect(extra.agent.protocol).to.equal('https:')
    fin()
  })
  //
})
