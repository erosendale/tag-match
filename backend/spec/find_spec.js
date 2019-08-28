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

  const janet = {
    name: "Janet",
    occupation: "Robot",
    dateOfBirth: "1990-11-21",
    bio: "I am a robot",
    tags: ['hockey', 'math', 'metal'],
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

  const jane = JSON.parse(JSON.stringify(janet));
  jane.name = "Jane";
  jane.bio = "I am Tarzan's wife";
  jane.occupation = 'Explorer';
  jane.tags = ['hockey', 'nature', 'gorillas']

  let users = [];

  beforeAll(async (done) => {
    users = await require('./bootstrap')(3);

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

  it('can find profiles', async function(done) {
    // Create 3 profiles and do a find
    let res = await request(app)
      .post('/api/v1/profile')
      .send(jason)
      .set('Authorization', users[0].accessToken)

    expect(res.status).toEqual(200);

    // Make sure the profile exists
    res = await request(app)
      .get(`/api/v1/profile/${users[0].userId}`)
      .set('Authorization', users[0].accessToken);

    expect(res.status).toEqual(200);
    expect(res.body.userId).toBeDefined();
    delete res.body.userId;
    res.body.tags.sort();
    jason.tags.sort();
    expect(res.body.tags).toEqual(jason.tags);
    const comparatorProfile = JSON.parse(JSON.stringify(jason)); // copy all the properties
    delete comparatorProfile.tags;
    delete res.body.tags;
    expect(res.body).toEqual(comparatorProfile);
  
    res = await request(app)
      .post('/api/v1/profile')
      .send(janet)
      .set('Authorization', users[1].accessToken);

    expect(res.status).toEqual(200);

    res = await request(app)
      .post('/api/v1/profile')
      .send(jane)
      .set('Authorization', users[2].accessToken);
    
    expect(res.status).toEqual(200);
    
    res = await request(app)
      .get('/api/v1/find')
      .set('Authorization', users[0].accessToken);
    expect(res.status).toEqual(200);
    expect(res.body.length).toEqual(2); // 2 profiles returned

    // Check that the profiles are the exact profiles we sent
    const janetRes = res.body.find(p => p.name === 'Janet');
    const janeRes = res.body.find(p => p.name === 'Jane');
    compareProfileWithResponse(janet, janetRes);
    compareProfileWithResponse(jane, janeRes);

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