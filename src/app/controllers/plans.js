const express = require('express');
const stripe = require('../services/stripe');

const router = express.Router();

router.get('/list', async (req, res) => {
    try {
        const plans = await stripe.plans.list({ limit: 3 });
        return res.status(200).send({ plans })
    } catch (error) {
        return res.status(400).send({ error: `Falha ao buscar planos: ${error}` })
    }
})

module.exports = app => app.use('/plans', router);