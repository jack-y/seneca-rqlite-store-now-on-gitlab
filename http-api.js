/* Copyright (c) 2017 e-soa Jacques Desodt, MIT License */
'use strict'

/**
 * HTTP API interface
 * Provides execute, transaction and query operations
 * For more informations on RQLite HTTP API, see:
 * https://github.com/rqlite/rqlite/blob/master/doc/DATA_API.md
**/

// Prerequisites
const requester = require('./requester')
const _ = require('lodash')
const isodateRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/

var httpapi = {}

// Executes one statement (insert/update/delete/etc)
httpapi.execute = function (options, statement) {
  return new Promise(function (resolve, reject) {
    // The transaction contains only one statement
    var transaction = [ statement ]
    // Runs the transaction
    httpapi.executeTransaction(options, transaction)
    .then(function (result) {
      // Execute successful
      return resolve({success: true})
    })
    .catch(function (err) { return reject(err) })
  })
}

// Executes a transaction: it's an array of statements
httpapi.executeTransaction = function (options, transaction) {
  return new Promise(function (resolve, reject) {
    // Sets the HTTP request
    var path = '/db/execute'
    requester.post(options, path, transaction)
    .then(function (executeResult) {
      // Checks if the execution returns an error string
      if (httpapi.getError(executeResult.data)) {
        return reject({
          error: httpapi.getError(executeResult.data),
          options: options,
          transaction: transaction
        })
      }
      // Execute successful
      return resolve({success: true})
    })
    .catch(function (err) { return reject(err) })
  })
}

// Query
// Returns an array of entities
httpapi.query = function (options, queryString) {
  return new Promise(function (resolve, reject) {
    // Sets the HTTP request
    var request = '/db/query?level=' +
      options.consistency_level + '&q=' +
      encodeURIComponent(queryString)
    // Calls the GET action
    requester.get(options, request)
    .then(function (queryResult) {
      // Checks if the query returns an error string
      if (httpapi.getError(queryResult.data)) {
        return reject({
          error: httpapi.getError(queryResult.data),
          options: options,
          query: queryString
        })
      }
      // Retrieves the query result
      httpapi.getValues(queryResult.data)
      .then(function (result) { return resolve(result) })
      .catch(function (err) {
        err.query = queryString
        return reject(err)
      })
    })
    .catch(function (err) {
      err.query = queryString
      return reject(err)
    })
  })
}

// Retrieves the entities array from the result
// Each result contains only one column: the JSON value
httpapi.getValues = function (queryResponse) {
  return new Promise(function (resolve, reject) {
    var entities = []
    // Checks if there is some results
    // The RQLite query response contains a results array
    if (queryResponse.results && queryResponse.results.length > 0) {
      var aResult = queryResponse.results[0]
      // The pattern of a result is {columns: [], types: [], values: []}
      if (aResult.values && aResult.values.length > 0) {
        aResult.values.forEach(function (item) {
          // Converts the JSON value to an object
          try {
            let entity = JSON.parse(item[0], function (key, val) {
              if (_.isString(val)) {
                // Checks if data is a date in ISO format
                if (val.match(isodateRegex)) {
                  return new Date(val)
                } else return val
              } else return val
            })
            // Stores the entity in the result array
            entities.push(entity)
          } catch (err) {
            // Bad JSON format
            return reject({error: err, item: item})
          }
        })
      }
    }
    return resolve(entities)
  })
}

// Checks if the API result is an error
// If true, returns the error as string
httpapi.getError = function (result) {
  var error = null
  if (result.results && result.results.length > 0) {
    if (result.results[0].error) {
      error = result.results[0].error
    }
  }
  return error
}

module.exports = httpapi
