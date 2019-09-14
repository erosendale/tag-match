'use strict';

const { getProfileFromDb } = require('./Profile/profileRouteHandler');
const Neo4jConn = require('../helpers/Neo4j');
const neo4j = require('neo4j-driver');
const { shuffle } = require('../helpers/utils');
const Profile = require('./Profile/Profile');

module.exports = findProfiles;

function findProfiles(req, res, next) {

    // Get the user's profile first for their preferences
    getProfileFromDb(req.user.id)
    .then(profile => {
        // Then find matches
        return find(profile);
    })
    .then(profiles => {
        res.json(profiles);
    })
    .catch(next);
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
            Neo4jConn.driver.close();
            reject(error);
        });
    });
    
}

function findLikes(profile) {

    // Start a session with neo4j
    const session = Neo4jConn.driver.session();

    // We want to show any profiles that like the user as long as they are within age range
    // We don't care about distance because they could have been nearby when the like was made
    return new Promise((resolve, reject) => {
        session.run(`
        MATCH (d)-[:LIKES]->(p:Profile {userId: {userId}})
        MATCH (d)-[:TAGGED]->(t:Tag)
        WHERE {minAge} <= duration.between(d.dateOfBirth, date()).years <= {maxAge}
        RETURN DISTINCT d, t.value as tag,
        toString(d.dateOfBirth) as dob, 
        d.location.latitude as latitude, 
        d.location.longitude as longitude`, {
            location: profile.location,
            maxDistance: profile.maxDistance,
            userId: profile.userId,
            minAge: profile.ageRange.min,
            maxAge: profile.ageRange.max
        })
        .then(result => {
            const profiles = getProfilesFromRecords(result.records);

            session.close();
            resolve(profiles);
        })
        .catch(error => {
            session.close();
            reject(error);
        });
    });
}

function findTags(profile) {

    // Start a session with neo4j
    const session = Neo4jConn.driver.session();

    // We will exclude likes here because we pull them seperately
    return new Promise((resolve, reject) => {
        session.run(`
        UNWIND {tags} as tag
        MATCH (d:Profile)-[:TAGGED]->(:Tag {value: tag})
        MATCH (d)-[:TAGGED]->(t:Tag)
        MATCH (p:Profile { userId: {userId} })
        WHERE NOT (d)-[:LIKES]->(p) AND NOT d.userId = {userId} AND
            distance(d.location, point({latitude: {latitude}, longitude: {longitude}})) <= {maxDistance} AND 
            {minAge} <= duration.between(d.dateOfBirth, date()).years <= {maxAge}
        RETURN DISTINCT d, t.value as tag,
        toString(d.dateOfBirth) as dob,
        d.location.longitude as longitude, 
        d.location.latitude as latitude`, {
            tags: profile.tags,
            latitude: profile.location.latitude,
            longitude: profile.location.longitude,
            maxDistance: profile.maxDistance,
            userId: profile.userId,
            minAge: profile.ageRange.min,
            maxAge: profile.ageRange.max
        })
        .then(result => {
            const profiles = getProfilesFromRecords(result.records);

            session.close();
            resolve(profiles);
        })
        .catch(error => {
            session.close();
            reject(error);
        });
    });
}

function getProfilesFromRecords(records) {
    const profileMap = new Map();

    // Each record will have a profile and a tag. Match them up.
    records.forEach(function(record) {
        const neoProfile = record.get('d').properties;
        if (!profileMap.has(neoProfile.userId)) {
            // Have to convert dateOfBirth from neo4j date back to a string
            neoProfile.dateOfBirth = record.get('dob');
            neoProfile.location = {x: record.get('longitude'), y: record.get('latitude')};
            
            // We need to convert the integer type the neo4j-driver uses to handle larger ints than javascript
            if (neo4j.v1.integer.inSafeRange(neoProfile.maxDistance)) {
                neoProfile.maxDistance = neo4j.v1.integer.toNumber(neoProfile.maxDistance);
            }
        
            profileMap.set(neoProfile.userId, neoProfile);
        }

        const profile = profileMap.get(neoProfile.userId);
        if (profile.hasOwnProperty('tags')) {
            profile.tags.push(record.get('tag'));
        } else {
            profile.tags = [record.get('tag')];
        }
    });

    const profiles = [];
    profileMap.forEach(profile => {
        profiles.push(Profile.fromNeo(profile));
    });

    return profiles;
}

