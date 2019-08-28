const request = require('supertest');
const app = require('../app');
const neo = require('neo4j-driver');

describe('Profile tests', function() {

  const profile = {
    name: "John",
    occupation: "Teacher",
    dateOfBirth: "1990-11-20",
    bio: "I like to teach and play sports",
    tags: ['hockey', 'football', 'surfing'],
    photos: ["face.jpg"],
    location: {
      latitude: 10,
      longitude: 10
    },
    maxDistance: 1000,
    ageRange: {
      min: 20,
      max: 30
    }
  }

  let authenticatedUser;

  beforeAll(async () => {
    authenticatedUser = await require('./bootstrap')();
    authenticatedUser = authenticatedUser[0];
  })

  it('can create a profile', function(done) {
    request(app)
      .post('/api/v1/profile')
      .send(profile)
      .set('Accept', 'application/json')
      .set('Authorization', authenticatedUser.accessToken)
      .end(function(err, res) {
        expect('Content-Type', 'application/json; charset=utf-8')
        expect(res.status).toEqual(200);

        expect(err).toBeNull();
        done();
      });
  });

  it('can get a profile', async function(done) {
    let res = await request(app)
      .get(`/api/v1/profile/fakeuserid`)
      .set('Authorization', authenticatedUser.accessToken);

    expect(res.status).toEqual(400); // no profile
    expect(res.body.error).toBeDefined();
    expect(res.body.error.errorCode).toEqual(301); // profile not found error

    res = await request(app)
      .get(`/api/v1/profile/${authenticatedUser.userId}`)
      .set('Authorization', authenticatedUser.accessToken);

    expect('Content-Type', 'application/json; charset=utf-8')
    expect(res.status).toEqual(200);

    expect(res.body.userId).toBeDefined();
    delete res.body.userId;

    res.body.tags.sort();
    profile.tags.sort();
    expect(res.body.tags).toEqual(profile.tags);

    const comparatorProfile = JSON.parse(JSON.stringify(profile)); // copy all the properties
    delete comparatorProfile.tags;
    delete res.body.tags;
    expect(res.body).toEqual(comparatorProfile);

    done();
  });
})