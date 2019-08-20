'use strict';

//const ConfigManager = require('../helpers/ConfigManager');
const Neo4jConn = require('../helpers/Neo4j');
var neo4j = require('neo4j-driver')
const { isEmpty } = require('../helpers/utils');
const DetailedError = require('../helpers/DetailedError');

//const config = ConfigManager.getConfig('mongo');
const collectionProfiles = 'profiles';

const router = require('express').Router();

router.route('/:userId')
  .get(getProfile)
  .post(createProfile);

module.exports = {
  routes: router,
  readProfileFromDb
};

function getProfile(req, res, next) {
  // Get the requested user profile
  const userId = req.params.userId;
  readProfileFromDb(userId)
  .then(profile => {
    res.json(profile);
  })
  .catch(next);
}

function readProfileFromDb(userId) {
  // Pull a profile from the db and return it
  const session = Neo4jConn.driver.session();
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
        const error = new DetailedError(400,
          DetailedError.errorCodes.ProfileNotFound, 
          `No profile found for userId: ${userId}`, 
          new Error().stack);
        reject(error);
        return;
      }

      profile['tags'] = tags;

      session.close();
      Neo4jConn.driver.close();
      resolve(profile);
    })
    .catch(error => {
      console.log(error);
      reject(error);
    });
  })
}

/**
 * Add a profile to the neo gdb
 * @param {*} req 
 * @param {*} res 
 */
function createProfile(req, res, user) {
   
  const userId = req.user.id;
  const profile = req.body;

  // Start a session with neo4j
  const session = Neo4jConn.driver.session();
  session
  .run(`
  CREATE (p:Profile { 
    userId : {userId},
    name : {name},
    dateOfBirth : date({dateOfBirth}),
    occupation : {occupation},
    bio : {bio},
    photos : {photos},
    location : point({latitude: {latitude}, longitude: {longitude}}),
    maxDistance : {maxDistance},
    ageRangeMin : {ageRangeMin},
    ageRangeMax : {ageRangeMax}  
  })
  WITH p
  FOREACH (t IN {tags} |
    MERGE (tag:Tag {value: t})
    MERGE (p)-[:TAGGED]->(tag)
  )
  RETURN p.userId AS userId`, { // TODO: I want to merge one node to multiple tags here
    userId: user.id,
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
  .subscribe({
    onNext: function(record) {
      console.log(record.get('userId'));
    },
    onCompleted: function() {
      session.close();
      Neo4jConn.driver.close();
      res.json('success');
    },
    onError: function(error) {
      console.log(error);
      res.status(500).json({message: JSON.stringify(error)});
    }
  });
}