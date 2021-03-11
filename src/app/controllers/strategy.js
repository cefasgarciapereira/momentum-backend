const express = require('express');
const bcrypt = require('bcryptjs');
const Strategy = require('../models/strategy.js');
const authConfig = require('../../config/auth.json');
const authMiddleware = require('../middlewares/auth');

const router = express.Router();

router.use('/', authMiddleware);

router.get('/',  async (req, res) => {
    try{
        const strategies = await Strategy.find().sort({date: 'desc'});
       return res.status(200).send({ strategies })
    }catch(error){
        return res.status(400).send({error: 'Falha ao buscar estratégias: '+error})
    }
})

router.get('/search', async (req, res) => {
    const {type, look_back, port_size } = req.body;
    let query = {}

    if(type) 
        query = {...query, type: type}
    
    if(look_back)
        query = {...query, look_back: look_back}
    
    if(port_size)
        query = {...query, port_size: port_size}

    try{
        const strategy = await Strategy.findOne(query)
        return res.status(200).send({strategy})
    }catch(error){
        return res.status(400).send({error: 'Falha ao buscar estratégia: '+error})
    }
})

module.exports = app => app.use('/strategy', router);