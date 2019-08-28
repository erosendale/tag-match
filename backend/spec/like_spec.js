const request = require('supertest');
const app = require('../app');
const Neo4jConn = require('../helpers/Neo4j');

describe('Find tests', function() {

  const jason = {
    name: "Jason",
    occupation: "Teacher",
    dateOfBirth: "1990-11-20",
    bio: "I like to teach and play sports",
    tags: ['hockey', 'football', 'surfing'],
    photos: ["face.jpg"],
    location: {
      longitude: 10,
      latitude: 10
    },
    maxDistance: 1000,
    ageRange: {
      min: 20,
      max: 30
    }
  }

  const audrey = {
    name: "Audrey",
    occupation: "Graphic Designer",
    dateOfBirth: "1990-11-21",
    bio: "I like art",
    tags: ['hockey', 'painting', 'jogging'],
    photos: ["face.jpg"],
    location: {
      longitude: 10,
      latitude: 10
    },
    maxDistance: 1000,
    ageRange: {
      min: 20,
      max: 30
    }
  }

  beforeEach(async (done) => {
    // Clear neo4j before we start to clear profiles from previous sessions
    let session = await Neo4jConn.session();
    await session.run(`
      MATCH (n)
      DETACH DELETE n`);
    session.close();

    session = await Neo4jConn.session();
    let res = await session.run(`
      MATCH (n)
      RETURN n`);
    expect(res.records).toEqual([]);
    session.close();

    Neo4jConn.close();
    done();
  })

  it('can like a profile', async function(done) {
    const users = await require('./bootstrap')(2);

    // Create 2 profiles
    let res = await request(app)
      .post('/api/v1/profile')
      .send(jason)
      .set('Authorization', users[0].accessToken)
    expect(res.status).toEqual(200);
  
    res = await request(app)
      .post('/api/v1/profile')
      .send(audrey)
      .set('Authorization', users[1].accessToken);
    expect(res.status).toEqual(200);

    res = await request(app)
      .get('/api/v1/find')
      .set('Authorization', users[1].accessToken);
    expect(res.status).toEqual(200);
    expect(res.body.length).toEqual(1); // jason returned
    // Check that the profiles are the exact profiles we sent
    const jasonRes = res.body.find(p => p.name === 'Jason');
    compareProfileWithResponse(jason, jasonRes);

    // Get Jason's userId and like him
    const jasonId = jasonRes.userId;
    res = await request(app)
      .post(`/api/v1/like/${jasonId}`)
      .set('Authorization', users[1].accessToken);
    expect(res.status).toEqual(200);

    // Like Audrey as well
    res = await request(app)
      .get('/api/v1/find')
      .set('Authorization', users[0].accessToken);
    expect(res.status).toEqual(200);
    expect(res.body.length).toEqual(1); // audrey returned
    // Check that the profiles are the exact profiles we sent
    const audreyRes = res.body.find(p => p.name === 'Audrey');
    compareProfileWithResponse(audrey, audreyRes);

    res = await request(app)
      .post(`/api/v1/like/${audrey.userId}`)
      .set('Authorization', users[1].accessToken);
    expect(res.status).toEqual(200);

    done();
  });

  it('can find profiles who liked you', async function(done) {

    // To differentiate between finding a user because they are close by, 
    // and finding a user because they liked you,
    // we will do a like when nearby, and them move away
    // this way the likee will see the like instead of the proximity find from the find function

    const users = await require('./bootstrap')(2);

    // Create 2 profiles
    let res = await request(app)
      .post('/api/v1/profile')
      .send(jason)
      .set('Authorization', users[0].accessToken)
    expect(res.status).toEqual(200);
  
    audrey.location.latitude = 12; // should be too far away
    res = await request(app)
      .post('/api/v1/profile')
      .send(audrey)
      .set('Authorization', users[1].accessToken);
    expect(res.status).toEqual(200);
    
    // Jason does not see Audrey because they are too far
    res = await request(app)
      .get('/api/v1/find')
      .set('Authorization', users[0].accessToken);
    expect(res.status).toEqual(200);
    expect(res.body.length).toEqual(0); // 0 profiles returned

    // Audrey drove nearby Jason so her profile updated
    audrey.location.latitude = 10;
    res = await request(app)
      .post('/api/v1/profile')
      .send(audrey)
      .set('Authorization', users[1].accessToken);
    expect(res.status).toEqual(200);

    // Audrey finds Jason and likes him
    res = await request(app)
      .get('/api/v1/find')
      .set('Authorization', users[1].accessToken);
    expect(res.status).toEqual(200);
    expect(res.body.length).toEqual(1); // jason returned
    // Check that the profiles are the exact profiles we sent
    const jasonRes = res.body.find(p => p.name === 'Jason');
    compareProfileWithResponse(jason, jasonRes);

    // If Jason logged in he'd see Audrey too
    res = await request(app)
      .get('/api/v1/find')
      .set('Authorization', users[0].accessToken);
    expect(res.status).toEqual(200);
    expect(res.body.length).toEqual(1);

    // Get Jason's userId and like him
    const jasonId = jasonRes.userId;
    res = await request(app)
      .post(`/api/v1/like/${jasonId}`)
      .set('Authorization', users[1].accessToken);
    expect(res.status).toEqual(200);

    // Drive home
    audrey.location.latitude = 12;
    res = await request(app)
      .post('/api/v1/profile')
      .send(audrey)
      .set('Authorization', users[1].accessToken);
    expect(res.status).toEqual(200);

    // Jason logs in and sees Audrey because she liked him
    res = await request(app)
      .get('/api/v1/find')
      .set('Authorization', users[0].accessToken);
    expect(res.status).toEqual(200);
    expect(res.body.length).toEqual(1);
    const audreyRes = res.body.find(p => p.name === 'Audrey');
    compareProfileWithResponse(audrey, audreyRes);

    done();
  });

  function compareProfileWithResponse(sentProfile, responseProfile) {
    expect(responseProfile).not.toBeNull();
    const resOrdered = {};
    expect(responseProfile.userId).toBeDefined();
    expect(responseProfile.tags).toBeDefined();
    responseProfile.tags.sort();
    Object.keys(responseProfile).sort().forEach(function(key) {
      resOrdered[key] = responseProfile[key];
    });
    const sentOrdered = {};
    Object.keys(sentProfile).sort().forEach(function(key) {
      sentOrdered[key] = sentProfile[key];
    });
    sentOrdered.tags.sort();
    sentOrdered.userId = responseProfile.userId;
    expect(JSON.stringify(resOrdered)).toEqual(JSON.stringify(sentOrdered));
  }
})