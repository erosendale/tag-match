const request = require('supertest');
const app = require('../app');
const uniqid = require('uniqid');

describe ('auth tests', function() {

  const uniqueUserSuffix = uniqid();
  const user = {
    emailAddress : `test.user.${uniqueUserSuffix}@fake.com`,
    password : "password"
  };

  it('can register a user', function(done) {
    request(app)
      .post('/api/v1/users/register')
      .send(user)
      .set('Accept', 'application/json')
      .end(function(err, res) {
        expect('Content-Type', 'application/json; charset=utf-8')
        expect(res.status).toEqual(200);
        
        expect(res.body._id).toBeDefined(); // userId
        expect(res.body.emailAddress).toEqual(user.emailAddress);
        expect(res.body.password).toBeDefined(); // hashed password

        expect(err).toBeNull();
        done();
      });
  }); 

  it('can login a user', function(done) {
    request(app)
      .post('/api/v1/users/login')
      .send(user)
      .set('Accept', 'application/json')
      .end(function(err, res) {
        expect('Content-Type', 'application/json; charset=utf-8')
        expect(res.status).toEqual(200);

        expect(res.body.token).toBeDefined();

        expect(err).toBeNull();
        done();
      });
  });
});