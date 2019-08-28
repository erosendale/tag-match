const request = require('supertest');
const app = require('../app');
const uniqid = require('uniqid');

async function doLogin(count=1) {
  const res = [];
  for (let i = 0; i < count; i++) {
    const uniqueUserSuffix = uniqid();
    const user = {
      emailAddress : `test.user.${uniqueUserSuffix}@fake.com`,
      password : "password"
    };

    const userId = await register(user);
    const accessToken = await login(user);
    res.push({
      userId,
      accessToken
    });
  }

  return res;
}

module.exports = doLogin;

function register(user) {
  return new Promise((resolve, reject) => {
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
        resolve(res.body._id);
    });
  });
}

function login(user) {
  return new Promise((resolve, reject) => {
    request(app)
    .post('/api/v1/users/login')
    .send(user)
    .set('Accept', 'application/json')
    .end(function(err, res) {
      expect('Content-Type', 'application/json; charset=utf-8')
      expect(res.status).toEqual(200);
      expect(res.body.token).toBeDefined();
      expect(err).toBeNull();
      resolve(res.body.token);
    });
  });
}