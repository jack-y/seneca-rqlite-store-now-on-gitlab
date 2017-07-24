/* Copyright (c) 2017 e-soa Jacques Desodt, MIT License */
'use strict'

/**
 * Load = CRUD read
 * Filters can be used
**/

// Prerequisites
const httpapi = require('./http-api')
const queryUtils = require('./query-utils')
const _ = require('lodash')
const moduleList = require('./module-list')

var moduleLoad = {}

moduleLoad.load = function (options, args) {
  return new Promise(function (resolve, reject) {
    // Checks the args coming from the load$ function
    if (args.q && args.qent) {
      //
      // Select optimization
      // Checks if only one ID is wanted
      var filters = args.q
      if (filters.id && Object.keys(filters).length === 1) {
        // We change the filter as the string ID for the next test
        filters = filters.id
      }
      // Checks if the filter is a string ID
      if (_.isString(filters)) {
        // Select on primary key for optimization
        var query = 'SELECT json FROM ' +
          queryUtils.escapeStr(queryUtils.getTablename(args.qent)) +
          ' WHERE id = "' + filters.replace(/"/g, '""') + '"'
        httpapi.query(options, query)
        .then(function (result) {
          // Checks if at least an entity is read
          if (result.length > 0) {
            return resolve(args.qent.make$(result[0]))
          } else {
            // No entity read
            return resolve(null)
          }
        })
        .catch(function (err) {
          // Checks if the error 'no such table' is ignored
          if (options.ignore_no_such_table_error &&
            err.error.indexOf(options.nosuchtable) !== -1) {
            return resolve(null)
          } else {
            // The error must be catched
            return reject(err)
          }
        })
      } else {
        //
        // The filter is not an unique ID
        // Uses moduleList to work with filters
        moduleList.list(options, args)
        .then(function (result) {
          // Checks if there is one entity
          if (result.length > 0) {
            // Returns the first read entity
            return resolve(args.qent.make$(result[0]))
          } else {
            // No entity in the list
            return resolve(null)
          }
        })
        .catch(function (err) { return reject(err) })
      }
    } else {
      return reject({error: options.badarguments, args: args})
    }
  })
}

module.exports = moduleLoad
