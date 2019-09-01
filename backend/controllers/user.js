'use strict';

const router = require('express').Router();

const User = require('../models/user');
const ErrorResponse = require('../helpers/ErrorResponse')
const bcrypt = require('bcryptjs');

require('dotenv').config();
const secret = process.env.SECRET || 'the default secret';
//gives us access to our environment variables 
//and sets the secret object.

const passport = require('passport');
const jwt = require('jsonwebtoken');

router.post('/register', (req,res,next) => {
   if (!validateUserParams(req.body, next)) return;
   User.findOne({emailAddress: req.body.emailAddress})
      .then(user => {
         if(user) {
            next(new ErrorResponse(400, ErrorResponse.errorCodes.UserRegisterEmailAlreadyExists, 'Email address exists in database'));
            return;
         } else {
            const newUser = new User({
                  emailAddress: req.body.emailAddress,
                  password: req.body.password
               });
               bcrypt.genSalt(10, (err, salt) => {
                  if(err) {
                     next(new ErrorResponse(500, ErrorResponse.errorCodes.UserRegisterBcryptError, 'User register bcrypt.genSalt error', err.stack));
                     return;
                  }
                  bcrypt.hash(newUser.password, salt, (err, hash) => {
                     if(err) {
                        next(new ErrorResponse(500, ErrorResponse.errorCodes.UserRegisterBcryptError, 'User register bcrypt.hash error', err.stack));
                        return;
                     }
                     newUser.password = hash;
                     newUser.save()
                     .then(user => res.json(user))
                     .catch(next);
                  }
               );
            });
         }
      })
      .catch(next);
});

router.post('/login', (req,res,next) => {
   if (!validateUserParams(req.body, next)) return;
   const emailAddress = req.body.emailAddress;
   const password = req.body.password;   
   User.findOne({ emailAddress: emailAddress })
      .then(user => {
         if (!user) {
            return res.status(404).json({ error: "No Account Found" });
         }
         bcrypt.compare(password, user.password)
         .then(isMatch => {
            if (isMatch) {
               const payload = {
                  id: user._id,
               };
               jwt.sign(payload, secret, { expiresIn: 36000 }, (err, token) => {
                  if (err) res.status(500).json({ 
                     error: "Error signing token",
                     raw: err 
                  }); 
                  res.json({
                     token: `Bearer ${token}` 
                  });
               });      
            } else {             
               res.status(400).json({ error: "Password is incorrect" });
            }
         });
      })
      .catch(next);
});

function validateUserParams(body, next) {
   if (typeof body.emailAddress === 'undefined') {
      next(new ErrorResponse(400, ErrorResponse.errorCodes.BadParameters, 'No email address provided'));
      return false;
   }
   if (typeof body.password === 'undefined') {
      next(new ErrorResponse(400, ErrorResponse.errorCodes.BadParameters, 'No password provided'));
      return false;
   }
   return true;
}

module.exports = router;