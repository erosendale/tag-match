const request = require('supertest');
const app = require('../app');
const uniqid = require('uniqid');

const uniqueUserSuffix = uniqid();
const user = {
  emailAddress : `test.user.${uniqueUserSuffix}@fake.com`,
  password : "password"
};

const authenticatedUser = {};

async function doLogin() {
  const userId = await register();
  const accessToken = await login();

  return {
    userId,
    accessToken
  };
}

module.exports = doLogin;

function register() {
  return new Promise((resolve, reject) => {
    request(app)
      .post('/users/register')
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

function login() {
  return new Promise((resolve, reject) => {
    request(app)
    .post('/users/login')
    .send(user)
    .set('Accept', 'application/json')
    .end(function(err, res) {
      expect('Content-Type', 'application/json; charset=utf-8')
      expect(res.status).toEqual(200);
      expect(res.body.success).toBeDefined();
      expect(res.body.token).toBeDefined();
      expect(err).toBeNull();
      resolve(res.body.token);
    });
  });
}