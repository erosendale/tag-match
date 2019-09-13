const request = require('supertest');
const app = require('../app');

describe('Healthcheck tests', function() {

  beforeAll(async () => {
    authenticatedUser = await require('./bootstrap')();
    authenticatedUser = authenticatedUser[0];
  })

  it('can get a successful healthcheck', function(done) {
    request(app)
      .get('/up')
      .set('Accept', 'application/json')
      .end(function(err, res) {
        expect('Content-Type', 'application/json; charset=utf-8')
        expect(res.status).toEqual(200);
        console.log(res.body);

        expect(err).toBeNull();
        done();
      });
  });
})