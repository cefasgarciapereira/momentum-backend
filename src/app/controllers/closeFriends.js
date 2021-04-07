const express = require('express');
const CloseFriends = require('../models/closeFriends.js');
const authMiddleware = require('../middlewares/auth');

const router = express.Router();

router.use('/', authMiddleware);

router.post('/', async (req, res) => {
    const { instagram_at } = req.body;

    try {
        if (await CloseFriends.findOne({ instagram_at }))
            return res.status(400).send({ error: 'Este perfil já foi incluído na lista.' });

        const friend = await CloseFriends.create({ ...req.body });
        return res.send({ friend });
    } catch (error) {
        return res.status(400).send({ error: `Falha ao incluir close friend: ${error.message}` });
    }
});

module.exports = app => app.use('/close-friends', router);