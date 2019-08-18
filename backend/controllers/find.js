'use strict';

//const ConfigManager = require('../helpers/ConfigManager');
const { readProfileFromDb } = require('./profile');
const Neo4jConn = require('../helpers/Neo4j');
const neo4j = require('neo4j-driver');
const { shuffle } = require('../helpers/utils');

// const config = ConfigManager.getConfig('mongo');
// const collectionProfiles = 'profiles';

module.exports = findProfiles;

function findProfiles(req, res) {

    // Get the user's profile first for their preferences
    readProfileFromDb(req.user.id)
    .then(profile => {
        // Then find matches
        return find(profile);
    })
    .then(profiles => {
        res.json(profiles);
    })
    .catch(error => {
        res.status(500).json({message: JSON.stringify(error)});
    });
}

function find(profile) {
    
    const likesPromise = findLikes(profile);
    const findPromise = findTags(profile);

    // Return when we get a response from both
    return new Promise((resolve, reject) => {
        Promise.all([likesPromise, findPromise]).then(function(values) {
            // We're done now so close the driver
            Neo4jConn.driver.close();

            // Returns 2 lists of profiles
            // Shuffle them together so the likes aren't at the top
            let resProfiles = values[0].concat(values[1]);
            resProfiles = shuffle(resProfiles);

            resolve(resProfiles);
        })
        .catch(error => {
            console.log(error);
            Neo4jConn.driver.close();
            reject(error);
        });
    });
    
}

function findLikes(profile) {

    // Start a session with neo4j
    const session = Neo4jConn.driver.session();

    return new Promise((resolve, reject) => {
        session.run(`
        MATCH (d)-[:LIKES]->(p:Profile {userId: {userId}})
        WHERE distance(d.location, {location}) <= {maxDistance} AND 
            {minAge} <= duration.between(d.dateOfBirth, date()).years <= {maxAge}
        RETURN DISTINCT d, 
        toString(d.dateOfBirth) as dob, 
        d.location.latitude as latitude, 
        d.location.longitude as longitude`, {
            location: profile.location,
            maxDistance: profile.maxDistance,
            userId: profile.userId,
            minAge: profile.ageRangeMin,
            maxAge: profile.ageRangeMax
        })
        .then(result => {
            const profiles = [];
            result.records.forEach(function(record) {
                const profile = record.get('d').properties;
                
                // Have to convert dateOfBirth from neo4j date back to a string
                profile.dateOfBirth = record.get('dob');
                profile.location = {latitude: record.get('latitude'), longitude: record.get('longitude')};
                
                // We need to convert the integer type the neo4j-driver uses to handle larger ints than javascript
                if (neo4j.v1.integer.inSafeRange(profile.maxDistance)) {
                    profile.maxDistance = neo4j.v1.integer.toNumber(profile.maxDistance);
                }
            
                profiles.push(profile);
            });

            session.close();
            
            resolve(profiles);
        })
        .catch(error => {
            console.log(error);
            session.close();
            reject(error);
        });
    });
}

function findTags(profile) {

    // Start a session with neo4j
    const session = Neo4jConn.driver.session();

    return new Promise((resolve, reject) => {
        session.run(`
        UNWIND {tags} as tag
        MATCH (d:Profile)-[:TAGGED]->(:Tag {value: tag})
        WHERE NOT d.userId = {userId} AND
            distance(d.location, {location}) <= {maxDistance} AND 
            {minAge} <= duration.between(d.dateOfBirth, date()).years <= {maxAge}
        RETURN DISTINCT d, 
        toString(d.dateOfBirth) as dob, 
        d.location.latitude as latitude, 
        d.location.longitude as longitude`, {
            tags: profile.tags,
            location: profile.location,
            maxDistance: profile.maxDistance,
            userId: profile.userId,
            minAge: profile.ageRangeMin,
            maxAge: profile.ageRangeMax
        })
        .then(result => {
            const profiles = [];
            result.records.forEach(function(record) {
                const profile = record.get('d').properties;
                
                // Have to convert dateOfBirth from neo4j date back to a string
                profile.dateOfBirth = record.get('dob');
                profile.location = {latitude: record.get('latitude'), longitude: record.get('longitude')};
                
                // We need to convert the integer type the neo4j-driver uses to handle larger ints than javascript
                if (neo4j.v1.integer.inSafeRange(profile.maxDistance)) {
                    profile.maxDistance = neo4j.v1.integer.toNumber(profile.maxDistance);
                }
            
                profiles.push(profile);
            });

            session.close();
            
            resolve(profiles);
        })
        .catch(error => {
            console.log(error);
            session.close();
            reject(error);
        });
    });
}

