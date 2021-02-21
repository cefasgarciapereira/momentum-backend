const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/user.js');
const jwt = require('jsonwebtoken');
const authConfig = require('../../config/auth.json');
const authMiddleware = require('../middlewares/auth');

const router = express.Router();

router.use('/auth', authMiddleware);

router.get('/', (req, res) => {
    res.send('OK');
})

router.get('/auth', (req, res) => {
    res.send('OK');
})

module.exports = app => app.use('/user', router);