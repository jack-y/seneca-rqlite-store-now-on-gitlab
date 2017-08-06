/* Copyright (c) 2017 e-soa Jacques Desodt, MIT License */
'use strict'

/**
 * Cluster Discovery Client
 * Performs the requests on other nodes
**/

// Prerequisites
const _ = require('lodash')
const http = require('http')
const https = require('https')

var discoclient = {}

// Performs a request
// This function returns a Promise
discoclient.request = function (options) {
  return new Promise(function (resolve, reject) {
    // First, retrieves the nodes list from the Discovery Service
    // Gets the protocol
    const prot = options.disco_url.startsWith('https') ? https : http
    // Sends the request to the Discovery Service
    var req = prot.get(options.disco_url, function (response) {
      // The Discovery Services returns the cluster data
      discoclient.processResponseNodes(options, response)
      .then(function (result) { return resolve(result) })
      .catch(function (err) { return reject(err) })
    })
    // Process the timeout event
    req.setTimeout(options.timeout, function () {
      return req.abort()
    })
    // Process the request errors
    req.on('error', function (error) {
      return reject({
        error: error,
        options: options
      })
    })
  })
}

discoclient.processResponseNodes = function (options, response) {
  return new Promise(function (resolve, reject) {
    // Checks if the response is OK
    if (response.statusCode === 200) {
      // Sets the response encoding
      response.setEncoding('utf8')
      // Initializes the response data
      var data = ''
      var jsonData
      // Grabs the returned data
      response.on('data', function (chunk) { data += chunk })
      // Gets all data on end
      response.on('end', function () {
        try {
          jsonData = JSON.parse(data)
        } catch (err) {
          // Invalid JSON
          return reject({
            error: 'Discovery Service returns invalid JSON',
            json: jsonData,
            options: options
          })
        }
        // Retrieves the nodes list
        var nodes = jsonData.nodes
        // Checks if 'nodes' is an array of strings
        if (nodes && _.every(nodes, _.isString)) {
          discoclient.processNodes(options, nodes)
          .then(function (result) { return resolve(result) })
          .catch(function (err) { return reject(err) })
        } else {
          // Invalid nodes array
          return reject({
            error: 'Discovery Service returns invalid nodes array',
            nodes: nodes,
            options: options
          })
        }
      })
    } else {
      // HTTP response on error
      return reject({
        error: 'Cannot request the Discovery Service',
        options: options,
        'status': response.statusCode
      })
    }
  })
}

discoclient.processNodes = function (options, nodes) {
  return new Promise(function (resolve, reject) {
    // Removes the current node with timeout
    const node = options.host + ':' + options.port
    if (nodes.indexOf(node) > -1) {
      nodes.splice(nodes.indexOf(node), 1)
    }
    // Checks if there is a node to query
    if (nodes.length > 0) {
      discoclient.requestFirstNode(options, nodes)
      .then(function (result) { return resolve(result) })
      .catch(function (err) { return reject(err) })
    } else {
      return reject({
        error: 'Discovery Service: no more nodes to query',
        options: options
      })
    }
  })
}

// Sends the HTTP/S request on the first node
discoclient.requestFirstNode = function (options, nodes) {
  return new Promise(function (resolve, reject) {
    // Stes the new host and port to request
    const node = nodes[0]
    var nodeOptions = _.cloneDeep(options)
    var parts = node.split(':')
    nodeOptions.host = parts[0]
    nodeOptions.port = parts[1]
    // Checks if the protocol is HTTPS
    var prot = nodeOptions.protocol.startsWith('https') ? https : http
    // Node.js: The protocol string must ends with ':'
    nodeOptions.protocol = nodeOptions.protocol.endsWith(':')
      ? nodeOptions.protocol : nodeOptions.protocol + ':'
    // Sends the request
    var req = prot.request(nodeOptions, function (response) {
      // Gets the response
      discoclient.processResponse(nodeOptions, response)
      .then(function (result) { return resolve(result) })
      .catch(function (err) { return reject(err) })
    })
    // Process the timeout event
    req.setTimeout(nodeOptions.timeout, function () {
      // Removes the current node from the list
      nodes.shift()
      // Retry on the next nodes
      discoclient.processNodes(nodeOptions, nodes)
      .then(function (result) { return resolve(result) })
      .catch(function (err) { return reject(err) })
    })
    // Process the request errors
    req.on('error', function (error) { // eslint-disable-line
      // Removes the current node from the list
      nodes.shift()
      // Retry on the next nodes
      discoclient.processNodes(nodeOptions, nodes)
      .then(function (result) { return resolve(result) })
      .catch(function (err) { return reject(err) })
    })
    // Writes the data to the HTTP request
    req.write(nodeOptions.postData)
    // Process the request end
    // This will fire the processResponse function
    req.end()
  })
}

// Processes the JSON response data
// This function returns a Promise
discoclient.processResponse = function (options, response) {
  return new Promise(function (resolve, reject) {
    // Initializes the response data
    var data = ''
    var jsonData
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
        try {
          jsonData = JSON.parse(data)
        } catch (err) {
          jsonData = {}
        }
        // Returns the response
        return resolve({data: jsonData})
      })
    } else {
      // Process status code != 200: error
      return reject({
        error: 'Discovery Service: node request on error',
        options: options,
        'status': response.statusCode
      })
    }
  })
}

module.exports = discoclient
