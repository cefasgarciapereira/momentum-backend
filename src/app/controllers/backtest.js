const express = require('express');
const bcrypt = require('bcryptjs');
const Backtest = require('../models/backtest.js');
const authMiddleware = require('../middlewares/auth');

const router = express.Router();

router.use('/', authMiddleware);

router.get('/search', async (req, res) => {
    const { type, universe, look_back, port_size, bt_interval } = req.query;
    let query = {}

    if (type)
        query = { ...query, type: type }

    if (look_back)
        query = { ...query, look_back: parseInt(look_back) }

    if (port_size)
        query = { ...query, port_size: parseInt(port_size) }

    if (universe)
        query = { ...query, universe: universe }

    if (bt_interval)
        query = { ...query, bt_interval: parseInt(bt_interval) }

    try {
        const backtest = await Backtest.findOne(query).sort({ datetime: 'desc' })
        return res.status(200).send({ backtest })
    } catch (error) {
        return res.status(400).send({ error: 'Falha ao buscar backtest: ' + error })
    }
})

module.exports = app => app.use('/backtest', router);