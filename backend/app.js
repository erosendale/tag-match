const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const mongoose = require('mongoose');
const config = require('./config');

// tutorial
// https://medium.com/@therealchrisrutherford/nodejs-authentication-with-passport-and-jwt-in-express-3820e256054f

require('dotenv').config();
// reads in configuration from a .env file

const app = express();


const port = process.env.PORT || 3000;
const dbPort = process.env.DB_PORT || 27017;
const dbUrl = process.env.DB_URL || "localhost";
const dbCollection = process.env.DB_COLLECTION || "auth-test";
//sets the required variables from Environment Variables.
mongoose.set('useCreateIndex', true);
//fixes an issue with a depricated default in Mongoose.js
mongoose.connect(`mongodb://${dbUrl}/${dbCollection}`, {useNewUrlParser: true})
       .then(_ => console.log('Connected Successfully to MongoDB'))
       .catch(err => console.error(err));

app.use(passport.initialize());
// initializes the passport configuration

require('./passport-config')(passport);
//imports our configuration file which holds our verification callbacks and things like the secret for signing.

app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

//custom Middleware for logging each request going to the API
app.use((req,res,next) => {
    if (req.body) log.info(req.body);
    if (req.params) log.info(req.params);
    if(req.query) log.info(req.query);
    log.info(`Received a ${req.method} request from ${req.ip} for ${req.url}`);
  next();
});

app.use('/users', require('./routes/user'));
//registers our authentication routes with Express.
app.listen(port, err => {
    if(err) console.error(err);
    console.log(`Listening for Requests on port: ${port}`);
});


// app.post('/login', passport.authenticate('local', { successRedirect: '/',
//                                                     failureRedirect: '/login' }));

// My custom middleware
// app.use(function timeLog(req, res, next) {
//     console.log('Time: ', Date.now());
//     next(); // pass control to the next handler
// });

// router.post('/login', passport.authenticate('local', { 
//     successRedirect: '/',
//     failureRedirect: '/login' }));

// router.route('/profile/:userId')
//     .get(function (req, res) {
//         res.send(`get profile! ${req.params.userId}`);
//     })
//     .post(function (req, res) {
//         res.send(`post profile! ${req.params.userId}`);
//     });

// router.route('/find')
//     .get(function (req, res) {
//         res.send(`finding matches!`);
//     });

// router.route('/like/:userId')
//     .post(function (req, res) {
//         res.send(`liked user! ${req.params.userId}`);
//     })
//     .delete(function (res, req) {
//         res.send(`deleted like for user! ${req.params.userId}`);
//     });

// app.use('/api/v1', router);
   
// app.listen(3000, () => console.log(`Listening on port 3000`));

module.exports = app; // for testing