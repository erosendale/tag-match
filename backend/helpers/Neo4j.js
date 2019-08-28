'use strict';

const neo4j = require('neo4j-driver');

const driver = neo4j.v1.driver(
    'bolt://localhost',
    //{ disableLosslessIntegers: true } This doesn't work at all
    neo4j.v1.auth.basic('neo4j', 'test')
);

// Create a session to run Cypher statements in.
// Note: Always make sure to close sessions when you are done using them!
//var session = driver.session();

module.exports = driver;