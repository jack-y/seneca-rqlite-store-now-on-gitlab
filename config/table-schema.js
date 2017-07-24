/* Copyright (c) 2017 e-soa Jacques Desodt, MIT License */
'use strict'

var config = {
  // Document database based on JSON values
  // Each table has the same schema
  schema: 'id text not null primary key, json text'
}

// Exports this configuration
module.exports = config
