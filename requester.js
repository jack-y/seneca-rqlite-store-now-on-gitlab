/* Copyright (c) 2017 e-soa Jacques Desodt */
'use strict'

/**
 * HTTP requester
 * Performs GET and POST operations
**/

// Prerequisites
const _ = require('lodash')
const http = require('http')
const https = require('https')

var requester = {}

// Gets data
// This function returns a Promise
requester.get = function (options, request) {
  return new Promise(function (resolve, reject) {
    // Checks the options
    if (_.isObject(options) &&
      _.isString(options.protocol) &&
      _.isString(options.host) &&
      options.port) {
      // Sets the redirects count
      var getOptions = _.cloneDeep(options)
      getOptions.redirects = getOptions.redirects ? getOptions.redirects : 0
      // Sets the input data used in the response process
      var input = {
        options: getOptions,
        action: 'get',
        request: request
      }
      // Checks if the protocol is HTTPS
      if (options.protocol === 'https') {
        // Sends the HTTPS request
        https.get('https://' + options.host + ':' + options.port +
          request, function (response) {
          // Gets the response
          requester.processResponse(input, response)
          .then(function (result) {
            return resolve(result)
          })
          .catch(function (err) { return reject(err) })
        }).on('error', function (error) {
          var err = {
            error: error,
            input: input
          }
          return reject(err)
        })
      } else {
        // Sends the HTTP request
        http.get('http://' + options.host + ':' + options.port +
          request, function (response) {
          // Gets the response
          requester.processResponse(input, response)
          .then(function (result) {
            return resolve(result)
          })
          .catch(function (err) { return reject(err) })
        }).on('error', function (error) {
          var err = {
            error: error,
            input: input
          }
          return reject(err)
        })
      }
    } else {
      // Bad options
      return reject({error: 'HTTP GET with bad options', options: options})
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
      // Sets the redirects count
      var getOptions = _.cloneDeep(options)
      getOptions.redirects = getOptions.redirects ? getOptions.redirects : 0
      // Sets the input data used in the response process
      var input = {
        options: getOptions,
        action: 'post',
        path: path,
        data: data
      }
      // Adds the non-fatal boolean
      data.fatal$ = false
      // Defines the POST options
      var postReq = null
      var postData = new Buffer(JSON.stringify(data))
      var postOptions = {
        hostname: options.host,
        port: options.port,
        path: path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Content-Length': postData.length
        },
        rejectUnauthorized: false // For self-signed certificates
      }
      // Checks if the protocol is HTTPS
      if (options.protocol === 'https') {
        // Sends the HTTPS request
        postReq = https.request(postOptions, function (response) {
          // Gets the response
          requester.processResponse(input, response)
          .then(function (result) {
            return resolve(result)
          })
          .catch(function (err) {
            err.input = input
            return reject(err)
          })
        })
      } else {
        // Sends the HTTP request
        postReq = http.request(postOptions, function (response) {
          // Gets the response
          requester.processResponse(input, response)
          .then(function (result) {
            return resolve(result)
          })
          .catch(function (err) {
            err.input = input
            return reject(err)
          })
        })
      }
      // Error process
      postReq.on('error', function (err) {
        err.input = input
        return reject(err)
      })
      // Writes the data to the HTTP/S target
      postReq.write(postData)
      return postReq.end()  // this will fire the processResponse function
      //
    } else {
      // Bad options
      return reject({error: 'HTTP POST bad options', options: options})
    }
  })
}

// Processes the JSON response data
// This function returns a Promise
requester.processResponse = function (input, response) {
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
        if (input.options.redirects < input.options.maxredirects) {
          // We can process the redirect once again
          var leader = response.headers['location']
          // New redirection attempt
          input.options.redirects ++
          // Gets the leader URL parts: protocol, host, port
          var parts = leader.split(':')
          var protocol = parts[0]
          var host = parts[1].replace('//', '')
          var port = parseInt(parts[2])
          // Sets the new options
          var newOptions = _.cloneDeep(input.options)
          newOptions.protocol = protocol
          newOptions.host = host
          newOptions.port = port
          // Checks if the redirection action is GET
          if (input.action === 'get') {
            requester.get(newOptions, input.request)
            .then(function (result) {
              return resolve(result)
            })
            .catch(function (err) { return reject(err) })
          } else {
            // The redirection action is POST
            requester.post(newOptions, input.path, input.data)
            .then(function (result) {
              return resolve(result)
            })
            .catch(function (err) { return reject(err) })
          }
        } else {
          // The maximum number of redirection attempts is reached
          return reject({
            error: input.options.toomuchredirects,
            input: input,
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

module.exports = requester
