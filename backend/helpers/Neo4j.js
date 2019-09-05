'use strict';

const neo4j = require('neo4j-driver');

require('dotenv').config();
// reads in configuration from a .env file

const dbUrl = process.env.DB_URL || "127.0.0.1";
const dbUsername = process.env.DB_USERNAME || "neo4j";
const dbPassword = process.env.DB_PASSWORD || "test";

const driver = neo4j.v1.driver(
    `bolt://${dbUrl}`,
    //{ disableLosslessIntegers: true } This doesn't work at all
    neo4j.v1.auth.basic(dbUsername, dbPassword)
);

// Create a session to run Cypher statements in.
// Note: Always make sure to close sessions when you are done using them!
//var session = driver.session();

module.exports = driver;