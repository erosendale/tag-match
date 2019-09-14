const request = require('supertest');
const app = require('../app');

describe('Healthcheck tests', function() {

  it('can get a successful healthcheck', function(done) {
    request(app)
      .get('/up')
      .set('Accept', 'application/json')
      .end(function(err, res) {
        expect('Content-Type', 'application/json; charset=utf-8')
        expect(res.status).toEqual(200);

        expect(err).toBeNull();
        done();
      });
  }, 10000);
})