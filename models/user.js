const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
 name: String,
 email:{
    type: String,
    unique: true,
    sparse: true,
    default: null
 },
 password: String,
})

module.exports = mongoose.model('user', UserSchema);