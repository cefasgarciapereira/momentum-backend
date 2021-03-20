const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/user.js');
const jwt = require('jsonwebtoken');
const authConfig = require('../../config/auth.json');
const authMiddleware = require('../middlewares/auth');

const router = express.Router();

router.use('/', authMiddleware);

router.post('/', async (req, res) => {
    const {email} = req.body;

    try{
        if(await User.findOne({email}))
            return res.status(400).send({error: 'Email já cadastrado.'});
            
        const user = await User.create({...req.body, logged: true});
        return res.send({user, token: generateToken({user: user})}); 
    }catch(error){
        return res.status(400).send({error: `Falha no cadastro: ${error.message}`});
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try{
        let user = await User.findOne({email}).select('+password');

        if(!user)
            return res.status(400).send({error: 'Usuário não encontrado.'});
        
        if(!await bcrypt.compare(password, user.password))
            return res.status(400).send({error: 'Senha incorreta.'});
        
        if(user && user.logged)
            return res.status(400).send({error: 'Múltiplos logins não são permitidos. Finalize sua sessão em outros dispositivos.'})
        
        await User.findByIdAndUpdate(user._id, {
            logged: true
        })
        user.password = undefined;
        user.logged = true;
        res.send({user, token: generateToken({user: user})});
    }catch(error){
        return res.status(400).send({error: error});
    }
});

router.post('/logout', async (req, res) => {
    const { id } = req.body;

    try{
        const user = await User.findByIdAndUpdate(id, {
            logged: false
        });
        res.send({success: true});
    }catch(error){
        return res.status(400).send({error: error});
    }
})

function generateToken(params = {}){
    return jwt.sign(params, authConfig.secret,{
        expiresIn: 86400,
    });
}

module.exports = app => app.use('/user', router);