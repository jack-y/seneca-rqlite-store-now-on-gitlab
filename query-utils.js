/* Copyright (c) 2017 e-soa Jacques Desodt, MIT License */
'use strict'

/**
 * UTILITIES
 * Escapes special characters
 * Retrieves the table name from an entity
 * Formats the 'where' part of a query
 * Performs sort$, skip$, limit$ and fields$ operations
**/

// Prerequisites
const _ = require('lodash')

var queryUtils = {}

// Gets the query with the 'where' part
// About the query syntax, see:
// http://senecajs.org/docs/tutorials/understanding-query-syntax.html
queryUtils.getQueryWhere = function (args) {
  // Initializes
  var query = args.q
  var sql = ''
  // Checks if the query exists
  if (query) {
    // Checks if the native$ SQL statement is used
    if (query.native$) {
      return query.native$
    } else {
      // No native$ SQL statement: we construct the statement
      sql = 'SELECT json FROM ' +
        queryUtils.escapeStr(queryUtils.getTablename(args.qent)) + ' '
      // Checks if the query contains one ID
      if (_.isString(query)) {
        sql += queryUtils.getWhereId(query)
      } else {
        // Checks if the query contains an array of IDs
        if (_.isArray(query)) {
          sql += queryUtils.getWhereArrayIds(query)
        } else {
          sql += queryUtils.getWhereFilters(query)
        }
      }
    }
  }
  // Returns the SQL statement
  return sql
}

// The query contains an ID
queryUtils.getWhereId = function (query) {
  return 'WHERE id = "' + query.replace(/"/g, '""') + '"'
}

// The query contains an array of IDs
queryUtils.getWhereArrayIds = function (query) {
  var condition = ''
  // Loops on each ID
  query.forEach(function (item) {
    let value = '"' + item.replace(/"/g, '""') + '"'
    condition += condition === '' ? value : ',' + value
  })
  return 'WHERE id IN (' + condition + ')'
}

// The query is an object of filters
queryUtils.getWhereFilters = function (query) {
  var where = ''
  var condition = ''
  // Loops on each filter to construct the 'where' string
  Object.keys(query).forEach(function (key, index) {
    // Checks if the filter is not a special seneca field
    // like sort$, skip$, limit$, fields$
    // These operations will be processed later
    if (!~key.indexOf('$')) {
      // Gets the string value of the condition
      var conditionValue = queryUtils.getStringValue(query[key])
      // Formats the string condition
      // See: https://sqlite.org/lang_corefunc.html#instr
      condition = 'instr(json, \'"' + key + '":' + conditionValue + '\')'
      // Adds the condition to the 'where' string
      where += where === '' ? 'WHERE ' + condition : ' AND ' + condition
    }
  })
  // Returns the 'where' string
  return where
}

// Gets the string representation of a value in the query
queryUtils.getStringValue = function (aValue) {
  // String case
  if (_.isString(aValue)) {
    var value = _.cloneDeep(aValue).replace(/"/g, '""').replace(/'/g, "''")
    return '"' + value + '"'
  }
  // Other case
  return '' + aValue
}

// Performs the sort$, skip$, limit$ and/or fields$ operations
queryUtils.sortSkipLimitFields = function (list, query) {
  // Always sort first, this is the 'expected' behaviour
  list = queryUtils.doSort(list, query)
  // Skip before limiting
  list = queryUtils.doSkip(list, query)
  list = queryUtils.doLimit(list, query)
  list = queryUtils.doFields(list, query)
  return list
}

// Sorts the list
queryUtils.doSort = function (list, query) {
  // Checks if sort$ is wanted
  if (query.sort$) {
    // The sorting field is the first one
    for (var sortField in query.sort$) {
      break
    }
    // Sets the ascending/descending order
    var order = query.sort$[sortField] < 0 ? -1 : 1
    // Sorts
    list = list.sort(function (a, b) {
      return order * (a[sortField] < b[sortField]
        ? -1
        : a[sortField] === b[sortField] ? 0 : 1)
    })
  }
  return list
}

// Skips into the list
queryUtils.doSkip = function (list, query) {
  // Checks if skip$ is wanted
  if (query.skip$ && query.skip$ > 0) {
    // Checks if the skip value is greater than the length of the list
    if (query.skip$ >= list.length) {
      return []
    }
    // The skip value is less than the length of the list
    list = list.slice(query.skip$)
  }
  return list
}

// Limits the list
queryUtils.doLimit = function (list, query) {
  // Checks if limit$ is wanted
  if (query.limit$ && query.limit$ >= 0) {
    list = list.slice(0, query.limit$)
  }
  return list
}

// Selects the fields to return
queryUtils.doFields = function (list, query) {
  // Checks if field$ is wanted
  if (query.fields$ && query.fields$.length > 0) {
    // Updates the list items
    list.map(function (item) {
      // Loops on each unwanted field
      Object.keys(item).forEach(function (name) {
        if (query.fields$.indexOf(name) === -1) {
          delete item[name]
        }
      })
      return item
    })
  }
  return list
}

// Escapes the special characters
queryUtils.escapeStr = function (input) {
  var str = '' + input
  // Escapes other characters
  return str.replace(/[\b\t\0\x1a\n\r"'\\\%]/g, function (char) { // eslint-disable-line
    switch (char) {
      case '\b':
        return '\\b'
      case '\t':
        return '\\t'
      case '\0':
        return '\\0'
      case '\x1a':
        return '\\z'
      case '\n':
        return '\\n'
      case '\r':
        return '\\r'
      case '\"': // eslint-disable-line
      case "'":
      case '\\':
      case '%':
        return '\\' + char

    }
  })
}

// Gets the RQLite table name from the entity namespace
queryUtils.getTablename = function (entity) {
  // Gets name
  var canon = entity.canon$({object: true})
  return (canon.base ? canon.base + '_' : '') + canon.name
}

module.exports = queryUtils
