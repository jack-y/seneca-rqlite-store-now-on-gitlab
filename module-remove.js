/* Copyright (c) 2017 e-soa Jacques Desodt, MIT License */
'use strict'

/**
 * Remove = CRUD delete
 * Filters can be used
**/

// Prerequisites
const _ = require('lodash')
const promise = require('bluebird')
const httpapi = require('./http-api')
const queryUtils = require('./query-utils')
const tableSchema = require('./config/table-schema')
const moduleList = require('./module-list')

var moduleRemove = {}

moduleRemove.remove = function (options, args) {
  return new Promise(function (resolve, reject) {
    // Checks the args coming from the remove$ function
    if (args.q && args.qent) {
      // Checks if all entities are to be removed
      if (args.q.all$) {
        moduleRemove.deleteAll(options, args)
        .then(function (result) { return resolve(null) })
        .catch(function (err) { return reject(err) })
      } else {
        // Checks if there is no filter
        if (Object.keys(args.q).length === 0) {
          // Gets the first ID and removes
          var query = 'SELECT json FROM ' +
            queryUtils.escapeStr(queryUtils.getTablename(args.qent)) + ' LIMIT 1'
          httpapi.query(options, query)
          .then(function (result) {
            if (result.length > 0) {
              moduleRemove.deleteFirst(options, args, result)
              .then(function (result) {
                return resolve(result)
              })
              .catch(function (err) { return reject(err) })
            } else {
              return resolve(null)
            }
          })
          .catch(function (err) { return reject(err) })
        } else {
          // Lists by filters and deletes the first one
          moduleList.list(options, args)
          .then(function (result) {
            moduleRemove.deleteFirst(options, args, result)
            .then(function (result) {
              return resolve(result)
            })
            .catch(function (err) { return reject(err) })
          })
          .catch(function (err) { return reject(err) })
        }
      }
    } else {
      return reject({error: options.badarguments, args: args})
    }
  })
}

// Deletes the first entity of a list$
moduleRemove.deleteFirst = function (options, args, list) {
  return new Promise(function (resolve, reject) {
    // Checks if the list contains at least an entity
    if (list.length > 0) {
      var previous = args.qent.make$(list[0])
      var delArgs = _.cloneDeep(args)
      delArgs.q.id = previous.id
      moduleRemove.deleteId(options, delArgs)
      .then(function (result) { return resolve(args.q.load$ ? previous : null) })
      .catch(function (err) { return reject(err) })
    } else {
      return resolve(null)
    }
  })
}

// Deletes an entity by its ID
// The arguments have been checked in the calling function
moduleRemove.deleteId = function (options, args) {
  return new Promise(function (resolve, reject) {
    // Executes the 'delete' action
    var statement = 'DELETE FROM ' +
      queryUtils.escapeStr(queryUtils.getTablename(args.qent)) + ' ' +
      'WHERE id = "' + args.q.id + '"'
    httpapi.execute(options, statement)
    .then(function (result) { return resolve(args.qent.make$(result)) })
    .catch(function (err) {
      // Checks if the error 'no such table' is ignored
      if (options.ignore_no_such_table_error &&
        err.error.indexOf(options.nosuchtable) !== -1) {
        return resolve({success: true})
      } else {
        // The error must be fired
        return reject(err)
      }
    })
  })
}

// Deletes all the entities
// The arguments have been checked in the calling function
moduleRemove.deleteAll = function (options, args) {
  return new Promise(function (resolve, reject) {
    // Optimizes the deletion
    // Checks if 'all$' is the only filter
    if (Object.keys(args.q).length === 1) {
      // Executes a 'truncate' by a drop/create transaction
      var tablename = queryUtils.escapeStr(queryUtils.getTablename(args.qent))
      // Truncates the table
      var transaction = [
        'DROP TABLE IF EXISTS ' + tablename,
        'CREATE TABLE ' + tablename + ' (' + tableSchema.schema + ')'
      ]
      httpapi.executeTransaction(options, transaction)
      .then(function (result) { return resolve(result) })
      .catch(function (err) { return reject(err) })
    } else {
      // There are others filters: list before delete
      moduleList.list(options, args)
      .then(function (result) {
        if (result.length > 0) {
          // Sets the delete commands
          var cmds = []
          result.forEach(function (item) {
            let delArgs = _.cloneDeep(args)
            delArgs.q.id = item.id
            let command = moduleRemove.deleteId(options, delArgs)
            cmds.push(command)
          })
          // Executes the delete commands and waits for finish
          promise.all(cmds)
          .then(function (results) {
            return resolve({success: true, results: results})
          })
        } else {
          // Nothing to delete
          return resolve({success: true})
        }
      })
      .catch(function (err) { return reject(err) })
    }
  })
}

module.exports = moduleRemove
