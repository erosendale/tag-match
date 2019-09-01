'use strict';

const Neo4jConn = require('../../helpers/Neo4j');
const ErrorResponse = require('../../helpers/ErrorResponse');
const Profile = require('./Profile');

const router = require('express').Router();

router.get('/:userId', getProfile);
router.post('/', createProfile);

module.exports = {
  routes: router,
  getProfileFromDb
};

function getProfile(req, res, next) {
  // Get the requested user profile
  const userId = req.params.userId;
  getProfileFromDb(userId)
  .then(profile => {
    res.json(profile);
  })
  .catch(next);
}

function getProfileFromDb(userId) {
  // Pull a profile from the db and return it
  const session = Neo4jConn.session();
  return new Promise((resolve, reject) => {
    session
    .run(`
    MATCH (p:Profile { userId: {userId} })-[:TAGGED]->(t)
    RETURN p, toString(p.dateOfBirth) as dob, t`,
      { userId: userId }
    )
    .then(result => {
      let profile;
      const tags = [];
      result.records.forEach(function(record) {
        profile = record.get('p').properties;
        profile.dateOfBirth = record.get('dob');
        tags.push(record.get('t').properties.value);
      });

      // Throw a not found exception if we couldn't find a profile
      if (typeof profile === 'undefined') {
        const error = new ErrorResponse(400,
          ErrorResponse.errorCodes.ProfileNotFound, 
          `No profile found for userId: ${userId}`, 
          new Error().stack);
        
        session.close();
        Neo4jConn.close();
        reject(error);
        return;
      }

      profile['tags'] = tags;

      session.close();
      Neo4jConn.close();
      resolve(Profile.fromNeo(profile));
    })
    .catch(reject);
  })
}

/**
 * Add a profile to the neo gdb
 * @param {*} req 
 * @param {*} res 
 */
function createProfile(req, res, next) {

  const profile = req.body;

  // Start a session with neo4j
  const session = Neo4jConn.session();
  session
  .run(`
  MERGE (p:Profile {userId: {userId}})
  SET p += { 
    name : {name},
    dateOfBirth : date({dateOfBirth}),
    occupation : {occupation},
    bio : {bio},
    photos : {photos},
    location : point({latitude: {latitude}, longitude: {longitude}}),
    maxDistance : {maxDistance},
    ageRangeMin : {ageRangeMin},
    ageRangeMax : {ageRangeMax}  
  }
  WITH p
  FOREACH (t IN {tags} |
    MERGE (tag:Tag {value: t})
    MERGE (p)-[:TAGGED]->(tag)
  )
  RETURN p.userId AS userId`, { // TODO: I want to merge one node to multiple tags here
    userId: req.user.id,
    name: profile.name,
    dateOfBirth: profile.dateOfBirth,
    occupation: profile.occupation,
    bio: profile.bio,
    photos: profile.photos,
    latitude: profile.location.latitude,
    longitude: profile.location.longitude,
    maxDistance: profile.maxDistance * 1000, // Convert kilometers to meters
    ageRangeMin: profile.ageRange.min,
    ageRangeMax: profile.ageRange.max,
    tags: profile.tags
  })
  .then(result => {
      session.close();
      Neo4jConn.close();
      res.json('success');
  })
  .catch(error => {
      session.close();
      Neo4jConn.close();
      next(error);
  });
}