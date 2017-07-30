/* Copyright (c) 2017 e-soa Jacques Desodt, MIT License */
'use strict'

/**
 * HTTP requester
 * Performs GET and POST operations
**/

// Prerequisites
const _ = require('lodash')
const http = require('http')
const https = require('https')
const httpKeepAliveAgent = new http.Agent({ keepAlive: true })
const httpsKeepAliveAgent = new https.Agent({ keepAlive: true })

var requester = {}

// Gets data
// This function returns a Promise
// path: e.g. /db/query?q=SELECT%20*FROM%20foo
requester.get = function (options, path) {
  return new Promise(function (resolve, reject) {
    // Checks the options
    if (_.isObject(options) &&
      _.isString(options.protocol) &&
      _.isString(options.host) &&
      options.port > 0) {
      // Sets the extra options
      var extraOptions = requester.setExtraOptions(options)
      extraOptions.path = path
      extraOptions.data = null
      extraOptions.method = 'GET'
      // Sends the request
      requester.request(extraOptions)
      .then(function (result) {
        return resolve(result)
      })
      .catch(function (err) { return reject(err) })
    } else {
      // Bad options
      return reject({error: 'HTTP GET request with bad options', options: options})
    }
  })
}

// Post data
// This function returns a Promise
requester.post = function (options, path, data) {
  return new Promise(function (resolve, reject) {
    // Checks the options
    if (_.isObject(options) &&
      _.isString(options.protocol) &&
      _.isString(options.host) &&
      options.port > 0) {
      // Sets the extra options
      var extraOptions = requester.setExtraOptions(options)
      extraOptions.path = path
      extraOptions.data = data
      extraOptions.method = 'POST'
      // Sets the POST data
      var postData = data ? new Buffer(JSON.stringify(data)) : ''
      extraOptions.postData = postData
      // Sets the headers
      extraOptions.headers = {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Content-Length': postData.length
      }
      // Sends the request
      requester.request(extraOptions)
      .then(function (result) {
        return resolve(result)
      })
      .catch(function (err) { return reject(err) })
    } else {
      // Bad options
      return reject({error: 'HTTP POST request with bad options', options: options})
    }
  })
}

// Sends the HTTP/S request
requester.request = function (options) {
  return new Promise(function (resolve, reject) {
    // Checks if the protocol is HTTPS
    var prot = options.protocol.startsWith('https') ? https : http
    // Sends the request
    var req = prot.request(options, function (response) {
      // Gets the response
      requester.processResponse(options, response)
      .then(function (result) {
        return resolve(result)
      })
      .catch(function (err) { return reject(err) })
    })
    // Process the request errors
    req.on('error', function (error) {
      var err = {
        error: error,
        options: options
      }
      return reject(err)
    })
    // Post: Writes the data to the HTTP/S target
    if (options.method === 'POST') {
      req.write(options.postData)
    }
    // Process the request end
    return req.end()  // this will fire the processResponse function
  })
}

// Processes the JSON response data
// This function returns a Promise
requester.processResponse = function (options, response) {
  return new Promise(function (resolve, reject) {
    // Initializes the response data
    var data = ''
    // Checks if the response is OK
    if (response.statusCode === 200) {
      // Sets the response encoding
      response.setEncoding('utf8')
      // Grabs the returned data
      response.on('data', function (chunk) {
        data += chunk
      })
      // Gets all data on end
      response.on('end', function () {
        var jsonData
        try {
          jsonData = JSON.parse(data)
        } catch (err) {
          jsonData = {}
        }
        // Returns the response
        return resolve({data: jsonData})
      })
    } else {
      // A request to a follower node has to be redirected to the leader
      // See: https://github.com/rqlite/rqlite/blob/master/doc/DATA_API.md#sending-requests-to-followers
      // Checks if we must redirect to the leader
      if (response.statusCode === 301) { // redirect
        // Checks if the maximum number of redirection attempts is not reached
        if (options.redirects < options.maxredirects) {
          // We can process the redirect once again
          var leader = response.headers['location']
          // New redirection attempt
          options.redirects ++
          // Gets the leader URL parts: protocol, host, port
          var parts = leader.split(':')
          var protocol = parts[0]
          var host = parts[1].replace('//', '')
          var port = parseInt(parts[2])
          // Sets the new options
          var newOptions = _.cloneDeep(options)
          newOptions.protocol = protocol
          newOptions.host = host
          newOptions.port = port
          // Checks if the redirection action is GET
          if (options.method === 'GET') {
            requester.get(newOptions, options.path)
            .then(function (result) {
              return resolve(result)
            })
            .catch(function (err) { return reject(err) })
          } else {
            // The redirection action is POST
            requester.post(newOptions, options.path, options.data)
            .then(function (result) {
              return resolve(result)
            })
            .catch(function (err) { return reject(err) })
          }
        } else {
          // The maximum number of redirection attempts is reached
          return reject({
            error: options.toomuchredirects,
            options: options,
            'status': response.statusCode
          })
        }
      } else {
        // Process status code != 200 and != 301: error
        return reject({'status': response.statusCode})
      }
    }
  })
}

// Returns a new options object with extra options set
requester.setExtraOptions = function (options) {
  // Input options by default
  var extra = _.cloneDeep(options)
  // Node.js: The protocol string must ends with ':'
  extra.protocol = extra.protocol.endsWith(':')
    ? extra.protocol : extra.protocol + ':'
  // Sets the redirects count
  extra.redirects = extra.redirects ? extra.redirects : 0
  // For self-signed certificates
  extra.rejectUnauthorized = false
  // Adds the keep-alive agent
  if (options.keepalive) {
    if (options.protocol.startsWith('https')) {
      extra.agent = httpsKeepAliveAgent
    } else {
      extra.agent = httpKeepAliveAgent
    }
  }
  return extra
}

module.exports = requester
