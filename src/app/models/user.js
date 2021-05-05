const mongoose = require('../../database');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        unique: true,
        required: true,
        lowercase: true
    },
    subscription_id: {
        type: String,
        default: null
    },
    customer_id: {
        type: String,
        default: null
    },
    payment_method_id: {
        type: String,
        default: null
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    session_id: {
        type: String,
        required: true,
        default: ''
    },
    refresh_token: {
        type: String,
        required: true,
        default: ''
    },
    welcome_message: {
        type: Boolean,
        required: true,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

UserSchema.pre('save', async function (next) {
    const hash = await bcrypt.hash(this.password, 10);
    this.password = hash;
    next();
})

const User = mongoose.model('User', UserSchema);
module.exports = User;