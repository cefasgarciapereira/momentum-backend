const mongoose = require('../../database');

const CloseFriendsSchema = new mongoose.Schema({
    instagram_at: {
        type: String,
        required: true,
        unique: true,
        required: true,
        lowercase: true
    },
    used: {
        type: Boolean,
        required: true,
        default: false
    },
    createdAt:{
        type: Date,
        default: Date.now,
    }
});

const closeFriends = mongoose.model('CloseFriends', CloseFriendsSchema);
module.exports = closeFriends;