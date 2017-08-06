/* Copyright (c) 2017 e-soa Jacques Desodt, MIT License */
'use strict'

/**
 * Save = CRUD create or update an entity
 * depending on the existence of the ID
**/

// Prerequisites
const uuidv4 = require('uuid/v4')
const tableSchema = require('./config/table-schema')
const httpapi = require('./http-api')
const queryUtils = require('./query-utils')
const _ = require('lodash')

var moduleSave = {}

moduleSave.save = function (options, args) {
  return new Promise(function (resolve, reject) {
    // Checks the args coming from the save$ function
    if (args.ent) {
      // Checks if the args entity has an ID
      if (args.ent.id) {
      // The entity has an ID: update
        moduleSave.update(options, args.ent)
        .then(function (result) { return resolve(result) })
        .catch(function (err) { return reject(err) })
      } else {
        // The entity has no ID: create
        moduleSave.create(options, args.ent)
        .then(function (result) { return resolve(result) })
        .catch(function (err) { return reject(err) })
      }
    } else {
      return reject({error: options.badarguments, args: args})
    }
  })
}

// Creates an entity
moduleSave.create = function (options, argsEntity) {
  return new Promise(function (resolve, reject) {
    // Initializes
    var entity = _.cloneDeep(argsEntity)
    var tablename = queryUtils.getTablename(entity)
    // Sets the current or generated ID for the entity
    moduleSave.setId(entity)
    // Sets the entity JSON string
    var mement = _.cloneDeep(entity)
    delete mement.entity$
    var jsonString = JSON.stringify(mement).replace(/'/g, "''")

    // Writes the entity
    var statement = "INSERT INTO " + // eslint-disable-line
      queryUtils.escapeStr(tablename) + "(id, json) VALUES('" +
      entity.id + "' , '" + jsonString + "')"
    httpapi.execute(options, statement)
    .then(function (result) {
      return resolve(entity) // Returns the entity with the ID set
    })
    .catch(function (err) {
      // Checks if the error 'no such table' is supported
      if (options.ignore_no_such_table_error &&
        err.error.indexOf(options.nosuchtable) !== -1) {
        // First, we create the table
        moduleSave.createTable(options, tablename)
        .then(function (result) {
          // Then, we retry to insert the entity
          moduleSave.create(options, argsEntity)
          .then(function (result) { return resolve(result) })
          .catch(function (err) { return reject(err) })
        })
        .catch(function (err) { return reject(err) })
      } else {
        return reject(err)
      }
    })
  })
}

// Updates an entity
moduleSave.update = function (options, entity) {
  return new Promise(function (resolve, reject) {
    // Transforms the input entity as object
    var entityObject = entity.data$()
    delete entityObject.entity$
    // Sets the RQLite table name
    var tablename = queryUtils.getTablename(entity)
    // Reads the previous version of the entity
    var query = 'SELECT json FROM ' +
      queryUtils.escapeStr(tablename) + ' ' +
      'WHERE id = "' + entity.id + '"'
    httpapi.query(options, query)
    .then(function (result) {
      // Checks if an entity is read
      if (result.length > 0) {
        // Sets the current values
        var previousObject = result[0]
        // Checks whether the merge is to be performed
        var shouldMerge = true
        if (options.merge !== false && entity.merge$ === false) {
          shouldMerge = false
        }
        if (options.merge === false && entity.merge$ !== true) {
          shouldMerge = false
        }
        var current = entityObject
        if (shouldMerge) {
          current = Object.assign(previousObject, entityObject)
        }
        // Removes seneca special properties
        delete current.merge$
        var jsonString = JSON.stringify(current).replace(/'/g, "''")
        // Executes the update
        var statement = "UPDATE " + // eslint-disable-line
          queryUtils.escapeStr(tablename) + " " + // eslint-disable-line
          "SET json = '" + jsonString + "' WHERE id = '" + entity.id + "'"
        httpapi.execute(options, statement)
        .then(function (result) { return resolve(entity.make$(current)) })
        .catch(function (err) { return reject(err) })
      } else {
        // No entity read
        // Update is now a Create
        moduleSave.create(options, entity)
        .then(function (result) { return resolve(result) })
        .catch(function (err) { return reject(err) })
      }
    })
    .catch(function (err) {
      // Checks if the error 'no such table' is to be ignored
      if (options.ignore_no_such_table_error &&
        err.error.indexOf(options.nosuchtable) !== -1) {
        // First, we create the table
        moduleSave.createTable(options, tablename)
        .then(function (result) {
          // Update is now a Create
          moduleSave.create(options, entity)
          .then(function (result) { return resolve(result) })
          .catch(function (err) { return reject(err) })
        })
        .catch(function (err) { return reject(err) })
      } else {
        // The error 'no such table' is not suppported
        // or it's another error
        return reject(err)
      }
    })
  })
}

// Creates the table
moduleSave.createTable = function (options, name) {
  return new Promise(function (resolve, reject) {
    // Executes the update
    var statement = 'CREATE TABLE ' +
      queryUtils.escapeStr(name) + ' (' + tableSchema.schema + ')'
    httpapi.execute(options, statement)
    .then(function (result) { return resolve(result) })
    .catch(function (err) { return reject(err) })
  })
}

// Sets the ID
moduleSave.setId = function (entity) {
  // Checks if the entity ID is not yet set
  if (!entity.id) {
    // Checks if the entity ID is set in meta data
    if (entity.id$) {
      // Uses the ID by default
      entity.id = entity.id$
      delete entity.id$
    } else {
      // Uses a generated ID
      entity.id = uuidv4()
    }
  }
}

module.exports = moduleSave
