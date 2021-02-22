const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/user.js');
const jwt = require('jsonwebtoken');
const authConfig = require('../../config/auth.json');
const authMiddleware = require('../middlewares/auth');

const router = express.Router();

router.use('/auth', authMiddleware);

router.post('/', async (req, res) => {
    const {email} = req.body;

    try{
        if(await User.findOne({email}))
            return res.status(400).send({error: 'Email já cadastrado.'});
            
        const user = await User.create(req.body);
        return res.send({user, token: generateToken({id: user.id})}); 
    }catch(error){
        return res.status(400).send({error: `Falha no cadastro: ${error.message}`});
    }
});

router.post('/login', async (req, res) => {
    const {email, password} = req.body;
    try{
        const user = await User.findOne({email}).select('+password');

        if(!user)
            return res.status(400).send({error: 'Usuário não encontrado.'});
        
        if(!await bcrypt.compare(password, user.password))
            return res.status(400).send({error: 'Senha incorreta.'});

        user.password = undefined;
        res.send({user, token: generateToken({id: user.id})});
    }catch(error){
        return res.status(400).send({error: error});
    }
});

router.get('/auth', (req, res) => {
    res.send('Autenticado');
})

router.get('/test', (req,res) => {
    res.send('Tudo certo!')
})

function generateToken(params = {}){
    return jwt.sign(params,authConfig.secret,{
        expiresIn: 86400,
    });
}

module.exports = app => app.use('/user', router);