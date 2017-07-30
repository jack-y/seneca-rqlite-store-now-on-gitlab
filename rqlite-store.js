/* Copyright (c) 2017 e-soa Jacques Desodt, MIT License */
'use strict'

/**
 * SENECA-RQLITE-STORE
 * RQLite Document Database driver for Seneca MVP toolkit
 * See:
 * http://senecajs.org/docs/tutorials/understanding-data-entities.html#using-databases-to-store-entity-data
 * https://github.com/rqlite/rqlite
 * https://en.wikipedia.org/wiki/Document-oriented_database
 *
 * Features:
 * Document Database model using JSON as data format
 * RQLite Distributed Database using SQLite and Raft
**/

// Default plugin options
const pluginName = 'rqlite-store'

// Prerequisites
const config = require('./config/' + pluginName)
const httpapi = require('./http-api')
//
const moduleList = require('./module-list')
const moduleLoad = require('./module-load')
const moduleRemove = require('./module-remove')
const moduleSave = require('./module-save')

// Plugin begins
module.exports = function (options) {
  // Initializes
  const seneca = this
  seneca.log.debug('Loading plugin:', seneca.context.full)
  seneca.log.debug('Default options:', config)
  seneca.log.debug('User options:', options)

  // Merges default options with options passed in seneca.use('plugin', options)
  options = seneca.util.deepextend(config, options)
  seneca.log.debug('Options:', options)

  // Defines the store using a description object
  // This is a convenience provided by seneca.store.init function
  var store = {
    name: pluginName,

    // CRUD functions

    load: function (args, done) { // READ
      moduleLoad.load(options, args)
      .then(function (result) {
        seneca.log.debug(function () {
          return ['load', args.q, args.qent.canon$({string: 1}), result.entity, desc]
        })
        return done(null, result)
      })
      .catch(function (err) {
        err.package = pluginName
        err.action = 'load'
        done(err)
      })
    },

    remove: function (args, done) { // DELETE
      moduleRemove.remove(options, args)
      .then(function (result) {
        seneca.log.debug(function () {
          return ['remove', args.q, args.qent.canon$({string: 1}), desc]
        })
        return done(null, result)
      })
      .catch(function (err) {
        err.package = pluginName
        err.action = 'remove'
        done(err)
      })
    },

    save: function (args, done) { // CREATE or UPDATE
      moduleSave.save(options, args)
      .then(function (result) {
        var operation = args.ent && args.ent.id ? 'update' : 'create'
        seneca.log.debug(function () {
          return ['save/' + operation, args.ent, args.ent.canon$({string: 1}), result, desc]
        })
        return done(null, result)
      })
      .catch(function (err) {
        err.package = pluginName
        err.action = 'save'
        done(err)
      })
    },

    // Others functions
    list: function (args, done) { // QUERY
      moduleList.list(options, args)
      .then(function (result) {
        seneca.log.debug(function () {
          return ['list', args.q, args.qent.canon$({string: 1}), desc]
        })
        return done(null, result)
      })
      .catch(function (err) {
        err.package = pluginName
        err.action = 'list'
        done(err)
      })
    },
    close: function (args, done) {
      // Nothing to close: this plugin uses the RQLite HTTP API
      seneca.log.debug(function () {
        return ['close', desc]
      })
      return done(null, {})
    },
    native: function (args, done) {
      // Access to the HTTP API
      seneca.log.debug(function () {
        return ['native', args.ent, args.ent.canon$({string: 1}), desc]
      })
      done(null, httpapi)
    }
  }

  // The calling Seneca instance will provide a description for us on init(),
  // it will be used in the logs
  var storedesc = seneca.store.init(seneca, options, store)
  var tag = storedesc.tag
  var desc = storedesc.desc

  // Adds the init process to seneca
  seneca.add({init: store.name, tag: tag}, function (args, done) {
    // Checks if the web option is used
    // See: https://github.com/senecajs/seneca-web
    if (options.web.dump) {
      // Adds this plugin to the web routes
      seneca.act('role:web', {
        use: {
          prefix: options.prefix,
          pin: {role: pluginName, cmd: '*'},
          map: {dump: true}
        }
      })
    }
    seneca.log.debug(function () {
      return ['init', desc]
    })
    done()
  })

  // We don't return the store itself, it will self load into Seneca via the
  // init() function. Instead we return a simple object with the stores name
  // and generated meta tag.
  return {name: store.name, tag: tag}
}
