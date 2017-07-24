![Logo]
> A [seneca.js][] data storage plugin.

# seneca-rqlite-store

Last update: 07/21/2017

<a href="https://badge.fury.io/js/seneca-rqlite-store"><img src="https://badge.fury.io/js/seneca-rqlite-store.svg" alt="npm version" height="20"></a>&nbsp;<a href="https://www.npmjs.com/package/seneca-rqlite-store"><img src="https://img.shields.io/npm/dm/seneca-rqlite-store.svg?maxAge=2592000" alt="Downloads count"></a>&nbsp;<a href="https://travis-ci.org/jack-y/seneca-rqlite-store"><img src="https://travis-ci.org/jack-y/seneca-rqlite-store.svg?branch=master" alt="build status" data-canonical-src="https://travis-ci.org/jack-y/seneca-rqlite-store.svg" height="20"></a>&nbsp;<a href="https://david-dm.org/jack-y/seneca-rqlite-store"><img src="https://david-dm.org/jack-y/seneca-rqlite-store.svg" alt="Dependency Status" data-canonical-src="https://david-dm.org/jack-y/seneca-rqlite-store.svg" height="20"></a>&nbsp;<a href='https://coveralls.io/github/jack-y/seneca-rqlite-store?branch=master'><img src='https://coveralls.io/repos/github/jack-y/seneca-rqlite-store/badge.svg?branch=master' alt='Coverage Status' /></a>

## Description

This module is a plugin for the [Seneca][] framework. It provides a storage engine that uses [RQLite][] to persist data in a distributed database.

### Seneca compatibility

Supports Seneca versions 1.x - 3.x

### Supported functionality

All Seneca data store supported functionality is implemented in [seneca-store-test][] as a test suite. The tests represent the store functionality specifications.

# How it works

## Document Database

RQLite is a Relational Distributed Database engine. However, this plugin is based on a [Document Database][] model. **This is a design choice**. It is intended to be able to manage NoSQL databases. If you need a pure Relational plugin, please consider to create yours (take a look at the [seneca-sqlite-store][] plugin).

### Features

- **no schema**: like MongoDB, OrientDB, CouchDB and so one. The data is saved in [JSON][] format.
- distributed data and **fault tolerance**: thanks to the [Raft][] algorithm implemented into [RQLite][]
- **easy** installation, deployment, and operation: RQLite uses [SQLite][] as its storage engine.
- **SQL operations** with optimized query on fields, despite the JSON format.

To take advantage of these features, **you do not need to make any changes** to your RQLite installation. All is provided by this plugin. Enjoy!

### Model

All the tables used by this plugin are to be created with this pattern:

	id text not null primary key, json text

To automatically create the tables when saving the entities, set the option `ignore_no_such_table_error` to `true`. See below.

> Note: all the IDs are generated using the `uuid` package.

### The tables name

Seneca provides a three layer [namespace][] for data entities:

- **zone**: optional. The name for a data set belonging to a business entity, geography, or customer.
- **base**: optional. The group name for entities that "belong together".
- **name**: mandatory. The primary name of the entity.

The base and name values define the table name into RQLite, with this pattern:

	[base_]name

## Options

This seneca-rqlite-store plugin provides a few options:

### store options

- **merge**: optional boolean, default is `true`. Like the others seneca store plugins, during an entity update operation, you can choose to merge the previous data with the news ones. Or not. This option is global. If you want a finer management, the same option can be set at the entity level, with the `merge$: true` property.
- **ignore_no_such_table_error**: optional boolean, default is `false`. If the application tries to create, update, delete or read an entity on an unknown table, an error is triggered. You can choose to ignore this error. See [below](#ignore-the-no-such-table-error).

### RQLite options

RQLite exposes an [HTTP API][] allowing the database to be modified such that the changes are replicated. The *seneca-rqlite-store* plugin uses this RQLite HTTP API to communicate with the databases. The options are:

- **protocol**: optional string, default is `'http'`. The HTTP protocol used. It can be `'http'` or `'https'`.
- **host**: optional string, default is `'127.0.0.1'`. The RQLite node address on the network.
- **port**: optional integer, default is `4001`. The RQLite node port number.
- **consistency_level**: optional string, default is `'weak'`. RQLite uses a read [consistency level][] to prevent results that are significantly out-of-date. The value can be `'none'`, `'weak'` or `'strong'`.
- **maxredirects**: optional integer, default is `10`. The maximum number of redirect attempts to the leader before triggering an error. See the doc about [sending requests to followers][].

> Note: as the RQLite documentation says, you can connect the plugin to any node in the cluster, and it will automatically forward its requests to the leader.

### Ignore the *no such table* error

An operation on an unknown table triggers the *no such table* error. Your application can ignore this error by setting the corresponding option to `true`. Then, no error is triggered and the behaviour changes:

- **list$**: the operation returns an empty array.
- **load$**: the operation returns a `null` value.
- **remove$**: the operation returns a `null` value.
- **save$**: the operation creates the table before saving the entity and returning the result.

# Usage

## Declaration

Your application must declare this plugin. Here is an exemple with the options set:

```js
seneca
  .use('basic') // v3.x
  .use('entity')
  .use('rqlite-store', {
    merge: false,
    ignore_no_such_table_error: true,
    protocol: 'https',
    host: '192.168.1.100',
    port: '4001',
    consistency_level: 'strong'
  })
```

## In your scripts

You don't use this module directly. It provides an underlying data storage engine for the Seneca entity API:

```js
var entity = seneca.make$('typename')
entity.someproperty = "something"
entity.anotherproperty = 100

entity.save$(function (err, entity) { ... })
entity.load$({id: ...}, function (err, entity) { ... })
entity.list$({property: ...}, function (err, entity) { ... })
entity.remove$({id: ...}, function (err, entity) { ... })
```

## Query Support

The standard Seneca [query format][] is supported:

- `.list$({f1:v1, f2:v2, ...})` implies pseudo-query `f1==v1 AND f2==v2, ...`.

- `.list$({f1:v1, ..., sort$:{f1:1}})` means sort by f1, ascending.

- `.list$({f1:v1, ..., sort$:{f1:-1}})` means sort by f1, descending.

- `.list$({f1:v1, ..., limit$:10})` means only return 10 results.

- `.list$({f1:v1, ..., skip$:5})` means skip the first 5.

- `.list$({f1:v1, ..., fields$:['f1','f2']})` means only return the listed fields.

> Note: you can use `sort$`, `limit$`, `skip$` and `fields$` together.

- `.list$({f1:v1, ..., sort$:{f1:-1}, limit$:10})` means sort by f1, descending and only return 10 results.

# Native driver

As with all seneca stores, you can access the native driver, in this case, the RQLite HTTP API object, using:

```js
entity.native$(function (err, httpapi) {...})
```

### Pay attention to the native$ field in the list$ function

This plugin works with Document Databases. This is a design constraint: all the tables have **only two text columns**: *id* and *json*. The only column to be processed and to retrieve is *json*. So, this code will return a result:

```js
entity.list$({native$: 'SELECT json FROM foo WHERE json LIKE "%John%"'})
```

While these lines will trigger an error:

```js
entity.list$({native$: 'SELECT * FROM foo WHERE age < 25'})  // Error: no such column
entity.list$({native$: 'SELECT * FROM foo WHERE json LIKE "%John%"'})  // Error: Unexpected number in JSON at position 1
```



## The native$ API

This API provides 3 functions:

- **execute**: executes one statement, like *update*, *create table* and so one. Please don't use this function for queries, use the *query* function below.
- **executeTransaction**: executes an array of statements into one transaction. This is more efficient.
- **query**: sends a request which will return an array of entities according to the query.

Each function returns a **promise**. This example shows how to drop a table:

```js
entity.native$(function (err, httpapi) {
  httapi.execute(options, 'DROP TABLE IF EXISTS foo')
  .then(function (result) {
    ... do some other stuff ...
  })
  .catch(function (error) {
    ... do some stuff with the error ...
  })
})
```

## execute

### Pattern

```js
httpapi.execute(options, statement)
```

- **options**: the RQLite HTTP options, as declared by the application. See the  [Declaration chapter](#declaration).
- **statement**: the SQL string. See the [SQLite documentation][] for more informations. Please don't use the *SELECT* statement here, use the *query* function below.

### Returned object

The promise resolves the `{success: true}` object, or reject an error if it is triggered.

## executeTransaction

### Pattern

```js
httpapi.executeTransaction(options, transaction)
```

- **options**: the RQLite HTTP options, as declared by the application. See the  [Declaration chapter](#declaration).
- **transaction**: an array of SQL statements. See the RQLite [Bulk API  documentation][] for more informations.

### Returned object

The promise resolves the `{success: true}` object, or reject an error if it is triggered.

## query

### Pattern

```js
httpapi.query(options, queryString)
```

- **options**: the RQLite HTTP options, as declared by the application. See the  [Declaration chapter](#declaration).
- **queryString**: the SQL SELECT string. Remember the design constraint: all the tables have **only two text columns**: *id* and *json*. See the [SQLite documentation][] for more informations on the SQL syntax.

### Returned object

The promise resolves an array of entities in accordance with the query, or reject an error if it is triggered.

# Install

To install, simply use npm:

```sh
npm install seneca-rqlite-store
```

# Test

**A rqlite node must be started**.

To connect to this node, please configure the RQLite HTTP options into the `./test/config.js` file.

Then, to run tests, simply use npm:

```sh
npm test
```

### Generated tests tables

Four tables will be generated: *mybase_test*, *test*, *foo* and *moon_bar*.

# Contributing
The [Senecajs org][] encourages open participation. If you feel you can help in any way, be it with documentation, examples, extra testing, or new features please get in touch.

## License
Copyright (c) 2017, Richard Rodger and other contributors.
Licensed under [MIT][].

[MIT]: ./LICENSE
[Logo]: http://senecajs.org/files/assets/seneca-logo.jpg
[Seneca.js]: https://www.npmjs.com/package/seneca
[Seneca]: http://senecajs.org/
[RQLite]: https://github.com/rqlite/rqlite
[seneca-sqlite-store]: https://github.com/senecajs-labs/seneca-sqlite-store
[JSON]: http://www.json.org/
[seneca-store-test]: https://github.com/senecajs/seneca-store-test
[Document Database]: https://en.wikipedia.org/wiki/Document-oriented_database
[Raft]: https://raft.github.io/
[SQLite]: https://www.sqlite.org/
[HTTP API]: https://github.com/rqlite/rqlite/blob/master/doc/DATA_API.md
[consistency level]: https://github.com/rqlite/rqlite/blob/master/doc/CONSISTENCY.md
[sending requests to followers]: https://github.com/rqlite/rqlite/blob/master/doc/DATA_API.md#sending-requests-to-followers
[namespace]: http://senecajs.org/docs/tutorials/understanding-data-entities.html#zone-base-and-name-the-entity-namespace4
[query format]: http://senecajs.org/docs/tutorials/understanding-query-syntax.html
[SQLite documentation]: https://www.sqlite.org/lang.html
[Bulk API documentation]: https://github.com/rqlite/rqlite/blob/master/doc/BULK.md
[Senecajs org]: https://github.com/senecajs/
