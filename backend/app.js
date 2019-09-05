const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const mongoose = require('mongoose');
const logger = require('./helpers/logger');
const { isEmpty } = require('./helpers/utils');
const YAML = require('yamljs');
const swaggerUi = require('swagger-ui-express'),
    swaggerDocument = YAML.load('./swagger.yaml');

// tutorial
// https://medium.com/@therealchrisrutherford/nodejs-authentication-with-passport-and-jwt-in-express-3820e256054f

require('dotenv').config();
// reads in configuration from a .env file

const app = express();

const port = process.env.PORT || 3000;
const dbUrl = process.env.DB_URL || "mongodb";
const dbCollection = process.env.DB_COLLECTION || "auth-test";
const dbUsername = process.env.DB_USERNAME || "root";
const dbPassword = process.env.DB_PASSWORD || "password";
//sets the required variables from Environment Variables.
mongoose.set('useCreateIndex', true);

mongoose.connect(`mongodb://${dbUsername}:${dbPassword}@${dbUrl}/${dbCollection}?authSource=admin&w=1`, { 
  useNewUrlParser: true //fixes an issue with a depricated default in Mongoose.js
});
  
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
app.listen(port, err => {
  if(err) console.error(err);
  console.log(`Listening for Requests on port: ${port}`);
});

module.exports = app; // for testing