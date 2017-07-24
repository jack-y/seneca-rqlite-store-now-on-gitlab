/* Copyright (c) 2017 e-soa Jacques Desodt, MIT License */
'use strict'

/**
 * TESTS FUNCTIONS
 * These functions are called only by the tests modules
**/

// Default plugin options
const pluginName = 'rqlite-store'
const tableSchema = require('../config/table-schema')

// Prerequisites
const requester = require('../requester')
const httpapi = require('../http-api')

// Sets and returns a Seneca instance in test mode
// Options can be passed to the rqlite-store plugin
exports.setSeneca = function (Seneca, options, role, fin, print) {
  return Seneca({log: 'test', timeout: 5000})
    // Activates unit test mode. Errors provide additional stack tracing context.
    // The fin callback is called when an error occurs anywhere.
    .test(fin, print)
    // Loads the microservice business logic
    .use('basic')
    .use('entity')
    .use('../' + pluginName, options)
    .error(fin)
    .gate()
}

// Sets and returns a Seneca instance in test mode for seneca-store-test
// See: https://github.com/senecajs/seneca-store-test
// Options can be passed to the rqlite-store plugin
exports.setSenecaBasic = function (Seneca, options, role, fin, print) {
  return Seneca({
    log: 'silent',
    default_plugins: {'mem-store': false},
    timeout: 5000})
    // Activates unit test mode. Errors provide additional stack tracing context.
    // The fin callback is called when an error occurs anywhere.
    .test(fin, print)
    // Loads the microservice business logic
    .use('basic')
    .use('entity', {mem_store: false})
    .use('../' + pluginName, options)
    .error(fin)
    .gate()
}

// Creates a table
exports.createTable = function (options, base, entityName) {
  return new Promise(function (resolve, reject) {
    // Sets the table name
    var tablename = exports.getTableName(base, entityName)
    // Creates the table
    requester.post(options, '/db/execute', [
      'CREATE TABLE ' + tablename + ' (' + tableSchema.schema + ')'
    ])
    .then(function (result) {
      return resolve(result)
    })
  })
}

// Creates a bad table with no 'json' field
exports.createBadTable = function (options, base, entityName) {
  return new Promise(function (resolve, reject) {
    // Sets the table name
    var tablename = exports.getTableName(base, entityName)
    // Sets the SQL pattern
    var pattern = 'id text not null primary key, badcolumn text'
    // Creates the table
    requester.post(options, '/db/execute', [
      'CREATE TABLE ' + tablename + ' (' + pattern + ')'
    ])
    .then(function (result) {
      return resolve(result)
    })
  })
}

// Drops a table
// If the table does not exist, no error is fired
exports.dropTable = function (options, base, entityName) {
  return new Promise(function (resolve, reject) {
    // Sets the table name
    var tablename = exports.getTableName(base, entityName)
    // Drops the table
    requester.post(options, '/db/execute', [
      'DROP TABLE IF EXISTS ' + tablename
    ])
    .then(function (result) {
      return resolve(result)
    })
  })
}

// Truncates a table
// As SQLite does not support the truncate feature,
// this is done by a drop/create transaction
exports.truncateTable = function (options, base, entityName) {
  return new Promise(function (resolve, reject) {
    // Sets the table name
    var tablename = exports.getTableName(base, entityName)
    // Drops then creates the table
    requester.post(options, '/db/execute', [
      'DROP TABLE IF EXISTS ' + tablename,
      'CREATE TABLE ' + tablename + ' (' + tableSchema.schema + ')'
    ])
    .then(function (result) {
      return resolve(result)
    })
  })
}

// Inserts an entity in a table
exports.insertEntity = function (options, base, entityName, entity) {
  return new Promise(function (resolve, reject) {
    // Sets the table name
    var tablename = exports.getTableName(base, entityName)
    // Inserts the data
    requester.post(options, '/db/execute', [
      "INSERT INTO " + tablename + "(id, json) VALUES('" + // eslint-disable-line
        entity.id + "' , '" +
        JSON.stringify(entity).replace(/'/g, "''") + "')"
    ])
    .then(function (result) {
      return resolve(result)
    })
  })
}

// Inserts an entity with a bad JSON field
exports.insertBadJsonEntity = function (options, base, entityName, entity) {
  return new Promise(function (resolve, reject) {
    // Sets the table name
    var tablename = exports.getTableName(base, entityName)
    // Inserts the data
    requester.post(options, '/db/execute', [
      "INSERT INTO " + tablename + "(id, json) VALUES('" + // eslint-disable-line
        entity.id + "' , 'this is not a JSON')"
    ])
    .then(function (result) {
      return resolve(result)
    })
  })
}

// Inserts an entity in the bad table with a bad column
exports.insertEntityInBadTable = function (options, base, entityName, entity) {
  return new Promise(function (resolve, reject) {
    // Sets the table name
    var tablename = exports.getTableName(base, entityName)
    // Inserts the data
    requester.post(options, '/db/execute', [
      "INSERT INTO " + tablename + "(id) VALUES('" + // eslint-disable-line
        entity.id + "')"
    ])
    .then(function (result) {
      return resolve(result)
    })
  })
}

// Reads an entity by its ID
exports.readEntity = function (options, base, entityName, id) {
  return new Promise(function (resolve, reject) {
    // Sets the table name
    var tablename = exports.getTableName(base, entityName)
    // Reads the data
    var queryString = "SELECT json FROM " + tablename + // eslint-disable-line
      " WHERE id = '" + id + "'"
    var request = '/db/query?q='
    request += encodeURIComponent(queryString)
    requester.get(options, request)
    .then(function (result) {
      return resolve(result.data)
    })
  })
}

// Counts the rows in a table
exports.count = function (options, base, entityName) {
  return new Promise(function (resolve, reject) {
    // Sets the table name
    var tablename = exports.getTableName(base, entityName)
    // Reads the data
    var queryString = 'SELECT count(id) FROM ' + tablename
    var request = '/db/query?q='
    request += encodeURIComponent(queryString)
    requester.get(options, request)
    .then(function (result) {
      var count = result.data.results[0].values[0][0]
      return resolve(count)
    })
  })
}

// Inserts a list of entities in a table
// This list is based on the example:
// http://senecajs.org/docs/tutorials/understanding-query-syntax.html#sample-entities
exports.insertList = function (options, base, entityName) {
  return new Promise(function (resolve, reject) {
    var tablename = exports.getTableName(base, entityName)
    // Transaction: drops the table and inserts the data
    requester.post(options, '/db/execute', [
      'DROP TABLE IF EXISTS ' + tablename,
      'CREATE TABLE ' + tablename + ' (' + tableSchema.schema + ')',
      'INSERT INTO ' + tablename + '(id, json) VALUES(' +
        '"001", "{""id"":""001"",""name"":""John"",""surname"":""Smith"",""address"":""Street 4"",""age"":26}")',
      'INSERT INTO ' + tablename + '(id, json) VALUES(' +
        '"002", "{""id"":""002"",""name"":""John"",""surname"":""Smith"",""address"":""Street 5"",""age"":40}")',
      'INSERT INTO ' + tablename + '(id, json) VALUES(' +
        '"003", "{""id"":""003"",""name"":""John"",""surname"":""Smith"",""address"":""Street 6""}")',
      'INSERT INTO ' + tablename + '(id, json) VALUES(' +
        '"004", "{""id"":""004"",""name"":""John"",""surname"":""Smith"",""address"":""Street 1"",""age"":15}")',
      'INSERT INTO ' + tablename + '(id, json) VALUES(' +
        '"005", "{""id"":""005"",""name"":""John"",""surname"":""Smith"",""address"":""Street 2"",""age"":31}")',
      'INSERT INTO ' + tablename + '(id, json) VALUES(' +
        '"006", "{""id"":""006"",""name"":""John"",""surname"":""Smith"",""address"":""Street 3"",""age"":26}")',
      'INSERT INTO ' + tablename + '(id, json) VALUES(' +
        '"007", "{""id"":""007"",""name"":""William"",""surname"":""Smith"",""address"":""Street 7"",""age"":31}")',
      'INSERT INTO ' + tablename + '(id, json) VALUES(' +
        '"008", "{""id"":""008"",""name"":""William"",""surname"":""Smith"",""address"":""Street 8""}")',
      'INSERT INTO ' + tablename + '(id, json) VALUES(' +
        '"009", "{""id"":""009"",""name"":""William"",""surname"":""McDonald"",""address"":""Street 9"",""age"":31}")'
    ])
    .then(function (result) {
      return resolve(result)
    })
  })
}

exports.getTableName = function (base, entityName) {
  return (base ? base + '_' : '') + entityName
}
