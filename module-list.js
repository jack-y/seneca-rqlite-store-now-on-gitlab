/* Copyright (c) 2017 e-soa Jacques Desodt, MIT License */
'use strict'

/**
 * List = QUERY
**/

// Prerequisites
const httpapi = require('./http-api')
const queryUtils = require('./query-utils')

var moduleList = {}

moduleList.list = function (options, args) {
  return new Promise(function (resolve, reject) {
    // Checks the args coming from the list$ function
    if (args.qent) {
      // Reads the entities
      var query = queryUtils.getQueryWhere(args)
      httpapi.query(options, query)
      .then(function (result) {
        var list = []
        // Checks if al least an entity is read
        if (result.length > 0) {
          // Sort, skip, limit and/or fields operations
          list = queryUtils.sortSkipLimitFields(result, args.q)
        }
        // Transform list items as seneca entities
        list.map(function (item) {
          return args.qent.make$(item)
        })
        return resolve(list)
      })
      .catch(function (err) {
        // Checks if the error 'no such table' is ignored
        if (options.ignore_no_such_table_error &&
          err.error.indexOf(options.nosuchtable) !== -1) {
          return resolve([])
        } else {
          // The error must be fired
          return reject(err)
        }
      })
    } else {
      return reject({error: options.badarguments, args: args})
    }
  })
}

module.exports = moduleList
