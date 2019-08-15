const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    emailAddress: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true
    }
});

module.exports = User = mongoose.model('User', UserSchema);