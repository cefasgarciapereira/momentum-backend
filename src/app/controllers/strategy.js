const express = require('express');
const bcrypt = require('bcryptjs');
const Strategy = require('../models/strategy.js');
const authConfig = require('../../config/auth.json');
const authMiddleware = require('../middlewares/auth');

const router = express.Router();

router.use('/', authMiddleware);

router.get('/',  async (req, res) => {
    try{
        const strategies = await Strategy.find().sort({datetime: 'desc'});
       return res.status(200).send({ strategies })
    }catch(error){
        return res.status(400).send({error: 'Falha ao buscar estratégias: '+error})
    }
})

router.get('/latest',  async (req, res) => {
    try{
        const strategies = await Strategy.findOne().sort({datetime: 'desc'});
       return res.status(200).send({ strategies })
    }catch(error){
        return res.status(400).send({error: 'Falha ao buscar estratégias: '+error})
    }
})

router.get('/search', async (req, res) => {
    const {type, universe, look_back, port_size } = req.query;
    let query = {}

    if(type) 
        query = {...query, type: type}
    
    if(look_back)
        query = {...query, look_back: parseInt(look_back)}
    
    if(port_size)
        query = {...query, port_size: parseInt(port_size)}
    
    if(universe)
        query = {...query, universe: universe}
    
    try{
        const strategy = await Strategy.findOne(query).sort({ datetime: 'desc' })
        return res.status(200).send({strategy})
    }catch(error){
        return res.status(400).send({error: 'Falha ao buscar estratégia: '+error})
    }
})

module.exports = app => app.use('/strategy', router);