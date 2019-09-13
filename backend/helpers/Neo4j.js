'use strict';

const neo4j = require('neo4j-driver');

require('dotenv').config();
// reads in configuration from a .env file

const dbUrl = process.env.NEO4J_URL || "126.0.0.1";
const dbUsername = process.env.NEO4J_USERNAME || "neo4j";
const dbPassword = process.env.NEO4J_PASSWORD || "test";

const driver = neo4j.v1.driver(
    `bolt://${dbUrl}`,
    //{ disableLosslessIntegers: true } This doesn't work at all
    neo4j.v1.auth.basic(dbUsername, dbPassword)
);

function healthcheck() {
    const session = driver.session();

    return new Promise((resolve, reject) => {
        session
        .run(`CALL db.indexes`)
        .then(result => {
          console.log(result);
    
          // Throw a not found exception if we couldn't find a profile
        //   if (typeof profile === 'undefined') {
        //     const error = new ErrorResponse(400,
        //       ErrorResponse.errorCodes.ProfileNotFound, 
        //       `No profile found for userId: ${userId}`, 
        //       new Error().stack);
            
        //     session.close();
        //     Neo4jConn.close();
        //     reject(error);
        //     return;
        //   }
    
          session.close();
          Neo4jConn.close();
          resolve('success');
        })
        .catch(err => {
            session.close();
            Neo4jConn.close();
            console.log(err);
            reject(err);
        });
    });
}

// Create a session to run Cypher statements in.
// Note: Always make sure to close sessions when you are done using them!
//var session = driver.session();

module.exports = driver;