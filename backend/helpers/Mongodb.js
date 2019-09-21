const mongoose = require('mongoose');

const dbUrl = process.env.MONGO_URL || "127.0.0.1";
const dbCollection = process.env.MONGO_AUTH_DB || "auth";
const dbUsername = process.env.MONGO_AUTH_USERNAME || "root";
const dbPassword = process.env.MONGO_AUTH_PASSWORD || "password";
//sets the required variables from Environment Variables.
mongoose.set('useCreateIndex', true);

function getConnection() {
    return new Promise((resolve, reject) => {
        mongoose.connect(`mongodb://${dbUsername}:${dbPassword}@${dbUrl}/${dbCollection}?authSource=admin&w=1`, { 
            useNewUrlParser: true, //fixes an issue with a depricated default in Mongoose.js
            connectTimeoutMS: 1800 //The default is 30 secs! Crazy!
        })
        .then(() => {
            resolve('success');
        })
        .catch(error => {
            reject(error);
        });
    });
}

function disconnect() {
    mongoose.disconnect;
}

module.exports = { getConnection, disconnect }
