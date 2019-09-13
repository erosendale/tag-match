const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const logger = require('./helpers/logger');
const mongo = require('./helpers/Mongodb');
const neo = require('./helpers/Neo4j');
const { isEmpty } = require('./helpers/utils');
const YAML = require('yamljs');
const swaggerUi = require('swagger-ui-express'),
    swaggerDocument = YAML.load('./swagger.yaml');




    function healthcheck() {
      console.log('inside healthcheck');
      const session = neo.session();
  
      return new Promise((resolve, reject) => {
          console.log('promise query');
          session
          .run(`MATCH (n)
          RETURN n`)
          .subscribe({
            onCompleted: function() {
                session.close();
                neo.close();
                resolve('success');
            },
            onError: function(err) {
              session.close();
              neo.close();
              reject(err);
            }
          });
          // .then(result => {
          //   console.log(`result: ${result}`);
      
          //   // Throw a not found exception if we couldn't find a profile
          // //   if (typeof profile === 'undefined') {
          // //     const error = new ErrorResponse(400,
          // //       ErrorResponse.errorCodes.ProfileNotFound, 
          // //       `No profile found for userId: ${userId}`, 
          // //       new Error().stack);
              
          // //     session.close();
          // //     Neo4jConn.close();
          // //     reject(error);
          // //     return;
          // //   }
      
          //   session.close();
          //   neo.close();
          //   resolve('success');
          // })
          // .catch(err => {
          //     session.close();
          //     neo.close();
          //     console.log(`error: ${err}`);
          //     reject(err);
          // });
      });
  }


// tutorial
// https://medium.com/@therealchrisrutherford/nodejs-authentication-with-passport-and-jwt-in-express-3820e256054f

require('dotenv').config();
// reads in configuration from a .env file

const app = express();

// Establish a connection to mongodb
mongo.getConnection();
  
app.use(passport.initialize());
// initializes the passport configuration

require('./passport-config')(passport);
//imports our configuration file which holds our verification callbacks and things like the secret for signing.

app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

//custom Middleware for logging each request going to the API
app.use((req,res,next) => {
  logger.log(`Received a ${req.method} request from ${req.ip} for ${req.url}`);
  if (!isEmpty(req.body))   logger.log(req.body);
  if (!isEmpty(req.params)) logger.log(req.params);
  if (!isEmpty(req.query))  logger.log(req.query);
  next();
});

// Readiness probe
app.get('/up', async (req, res) => {
  const connection = await mongo.getConnection();
  if (connection != 'success') res.status(500).send(connection);

  console.log('call healthcheck');
  healthcheck()
  .then((res) => {
    console.log(res);
  })
  .catch((err) => {
    console.log(err);
    res.status(500).send(err);
    return;
  });

  // const session = neo.session();
  // session.close();
  
  res.send('success');
});

// Routes
router.use('/users', require('./controllers/user'));
router.use('/users/me', passport.authenticate('jwt', {session: false}), (req, res) => res.json(req.user));
router.use('/profile', passport.authenticate('jwt', {session: false}), require('./controllers/Profile/profileRouteHandler').routes);
router.use('/find', passport.authenticate('jwt', {session: false}), require('./controllers/find'));
router.use('/like', passport.authenticate('jwt', {session: false}), require('./controllers/like'));

app.use('/api/v1', router);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Error logging
app.use(function (err, req, res, next) {
  logger.error(err);
  if (!err.statusCode) err.statusCode = 500;
  if (err.stack) err = {statusCode: err.statusCode, raw: err.stack} // handle default errors
  res.status(err.statusCode).json({error: err});
});

//registers our authentication routes with Express.
const port = process.env.PORT || 3000;
app.listen(port, err => {
  if(err) console.error(err);
  console.log(`Listening for Requests on port: ${port}`);
});

module.exports = app; // for testing