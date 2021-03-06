const express = require('express');
const Price = require('../models/price.js');
const authMiddleware = require('../middlewares/auth');

const router = express.Router();

router.use('/', authMiddleware);

router.get('/',  async (req, res) => {
    try{
        const prices = await Price.find({ index: "IBRA" });
       return res.status(200).send({ prices })
    }catch(error){
        return res.status(400).send({error: 'Falha ao buscar preços: '+error})
    }
})

module.exports = app => app.use('/price', router);