const express = require('express');
const bcrypt = require('bcryptjs');
const Strategy = require('../models/strategy.js');
const authConfig = require('../../config/auth.json');
const authMiddleware = require('../middlewares/auth');

const router = express.Router();

router.use('/auth', authMiddleware);

router.get('/auth',  async (req, res) => {
    try{
        const strategies = await Strategy.find().sort({date: 'desc'});
        res.status(200).send({ strategies })
    }catch(error){
        return res.status(400).send({error: 'Falha ao buscar estratégias: '+error})
    }
})

module.exports = app => app.use('/strategy', router);