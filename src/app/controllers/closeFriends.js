const express = require('express');
const CloseFriends = require('../models/closeFriends.js');
const authMiddleware = require('../middlewares/auth');

const router = express.Router();

router.use('/', authMiddleware);

router.post('/add', async (req, res) => {
    const { instagram_at, pass } = req.body;


    try {
        if (await CloseFriends.findOne({ instagram_at }))
            return res.status(400).send({ error: 'Este perfil já foi incluído na lista.' });

        if(pass !== 'W+6{QMD!EdG7=aLj')
            return res.status(400).send({ error: 'Código Inválido' });

        const friend = await CloseFriends.create({ ...req.body });
        return res.send({ friend });
    } catch (error) {
        return res.status(400).send({ error: `Falha ao incluir close friend: ${error.message}` });
    }
});

router.post('/multiples', async (req, res) => {
    // in development!!!
    const { instagrams } = req.body;
    let fails = []
    let inserted = []

    try {
        await instagrams.forEach(async (instagram_at) => {
            try {
                const exists = await CloseFriends.findOne({ instagram_at })
                if (!exists) {
                    const created = await CloseFriends.create({ instagram_at });
                    if (created) {
                        inserted.push(instagram_at)
                    } else {
                        fails.push(instagram_at)
                    }
                } else {
                    fails.push(instagram_at)
                }
            } catch (err) {
                fails.push(instagram_at)
            }
        })

        return res.send({
            fails: fails,
            inserted: inserted,
            inserted_count: inserted.length,
            fails_count: fails.length,
        });

    } catch (error) {
        return res.status(400).send({ error: `Falha ao processar os perfis de instagram: ${error.message}` });
    }
});

module.exports = app => app.use('/close-friends', router);