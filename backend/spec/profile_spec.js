const request = require('supertest');
const app = require('../app');
//const authenticatedUser = require('./bootstrap');

describe('Profile tests', function() {

  const profile = {
    tags: ['hockey', 'football', 'surfing']
  }

  let authenticatedUser;

  beforeAll(async () => {
    authenticatedUser = await require('./bootstrap')();
  })

  it('can get a profile', function(done) {
    request(app)
      .get(`/api/v1/profile/${authenticatedUser.userId}`)
      .set('Accept', 'application/json')
      .set('Authorization', authenticatedUser.accessToken)
      .end(function(err, res) {
        expect('Content-Type', 'application/json; charset=utf-8')
        expect(res.status).toEqual(400); // no profile
        expect(res.body.error).toBeDefined();
        expect(res.body.error.errorCode).toEqual(101); // profile not found error

        expect(err).toBeNull();
        done();
      });
  });

  // it('can create a profile', function(done) {
  //   request(app)
  //     .post('/profile')
  //     .send(profile)
  //     .set('Accept', 'application/json')
  //     .set('Authorization', authenticatedUser.accessToken)
  //     .end(function(err, res) {
  //       expect('Content-Type', 'application/json; charset=utf-8')
  //       expect(res.status).toEqual(200);

  //       expect(err).toBeNull();
  //       done();
  //     });
  // });
})