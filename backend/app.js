const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const logger = require('./helpers/logger');
const mongo = require('./helpers/Mongodb');
const Neo4jConn = require('./helpers/Neo4j');
const { isEmpty } = require('./helpers/utils');
const YAML = require('yamljs');
const swaggerUi = require('swagger-ui-express'),
    swaggerDocument = YAML.load('./swagger.yaml');

require('dotenv').config();
// reads in configuration from a .env file

const app = express();

// Enable cors
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, PUT, PATCH, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, api_key, Authorization");
  next();
});

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
  try {
    await mongo.getConnection();
  } catch (error) {
    mongo.disconnect();
    console.error(error);
    res.status(500).send(error);
  }

  mongo.disconnect();

  try {
    await Neo4jConn.healthcheck();
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }

  res.send('success');
});

// Routes
router.use('/users', require('./controllers/user'));
router.use('/users/me', passport.authenticate('jwt', {session: false}), (req, res) => res.json(req.user));
router.use('/profile', passport.authenticate('jwt', {session: false}), require('./controllers/Profile/profileRouteHandler').routes);
router.use('/find', passport.authenticate('jwt', {session: false}), require('./controllers/find'));
router.use('/like', passport.authenticate('jwt', {session: false}), require('./controllers/like'));

app.use('/api/v1', router);

const options = {
  swaggerOptions: {
    validatorUrl: null,
    cors: true,
  }
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, options));

// Error logging
app.use(function (err, req, res, next) {
  logger.error(err);
  if (!err.statusCode) err.statusCode = 500;
  if (err.stack) err = {statusCode: err.statusCode, raw: err.stack} // handle default errors
  res.status(err.statusCode).json({error: err});
});

//registers our authentication routes with Express.
const port = process.env.PORT || 8080;
app.listen(port, err => {
  if(err) console.error(err);
  console.log(`Listening for Requests on port: ${port}`);
});

module.exports = app; // for testing