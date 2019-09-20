'use strict';

const neo4j = require('neo4j-driver');

require('dotenv').config();
// reads in configuration from a .env file

const dbUrl = process.env.NEO4J_URL || "127.0.0.1";
const dbUsername = process.env.NEO4J_USERNAME || "neo4j";
const dbPassword = process.env.NEO4J_PASSWORD || "test";

const driver = neo4j.v1.driver(
    `bolt://${dbUrl}`,
    neo4j.v1.auth.basic(dbUsername, dbPassword),
    { connectionTimeout: 1800,
    disableLosslessIntegers: true }
);

const indexes = [];
function addIndexes() {
    indexes.concat(arguments);
}

function healthcheck() {
    const session = driver.session();

    return new Promise((resolve, reject) => {
        session
        .run(`CALL db.indexes()`)
        .then(result => {
          session.close();
          driver.close();

          let foundIndexes = 0;
          result.records.forEach(record => {
            const index = record.get('description');
            if (indexes.includes(index)) {
              foundIndexes += 1;
            }
          });

          if (foundIndexes >= indexes.length) {
            resolve('success');
          } else {
            reject(err);
          }
        })
        .catch(err => {
          session.close();
          driver.close();
          reject(err);
        })
    });
}

// Create a session to run Cypher statements in.
// Note: Always make sure to close sessions when you are done using them!
//var session = driver.session();

module.exports = { 
    driver,
    addIndexes, 
    healthcheck 
}