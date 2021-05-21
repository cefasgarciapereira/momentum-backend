const express = require('express');
const Ticker = require('../models/ticker.js');
const authMiddleware = require('../middlewares/auth');

const router = express.Router();

router.use('/', authMiddleware);

router.post('/search',  async (req, res) => {
    const { ticker } = req.body
    try{
        const prices = await Ticker.find({ ticker });
       return res.status(200).send({ prices })
    }catch(error){
        return res.status(400).send({error: 'Falha ao buscar preços: '+error})
    }
})

module.exports = app => app.use('/ticker', router);