const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/user.js');
const CloseFriends = require('../models/closeFriends.js');
const jwt = require('jsonwebtoken');
const authConfig = require('../../config/auth.json');
const authMiddleware = require('../middlewares/auth');
const nodemailer = require('nodemailer');
const SMTP_CONFIG = require('../../config/smtp')

const router = express.Router();

router.use('/', authMiddleware);

router.post('/register', async (req, res) => {
    const { email, instagram_at } = req.body;

    try {
        if (await User.findOne({ email }))
            return res.status(400).send({ error: 'Email já cadastrado.' });

        const closeFriend = await CloseFriends.findOne({ instagram_at })

        if (!instagram_at)
            return res.status(400).send({ error: 'Perfil de instagram não informado.' });

        if (!closeFriend)
            return res.status(400).send({ error: 'O perfil de instagram informado não consta na lista de convidados.' });

        if (closeFriend.used)
            return res.status(400).send({ error: 'Este perfil de instagram já foi utilizado em um outro cadastro.' });

        const session_id = bcrypt.genSaltSync(10);

        await CloseFriends.findOneAndUpdate({ instagram_at: instagram_at }, { used: true })

        const user = await User.create({
            ...req.body,
            session_id: session_id,
            refresh_token: generateRefreshToken({ email: email })
        });

        return res.send({
            user, token: generateToken({
                user,
                token: generateToken({ user: user }),
                refreshToken: generateRefreshToken({ user: user })

            })
        });
    } catch (error) {
        return res.status(400).send({ error: `Falha no cadastro: ${error.message}` });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email }).select('+password');

        if (!user)
            return res.status(400).send({ error: 'Usuário não encontrado.' });

        if (!await bcrypt.compare(password, user.password))
            return res.status(400).send({ error: 'Senha incorreta.' });

        const session_id = bcrypt.genSaltSync(10);

        await User.findByIdAndUpdate(user._id, {
            session_id: session_id
        })

        user.password = undefined;
        user.session_id = session_id;
        res.send({
            user,
            token: generateToken({ user: user }),
        });
    } catch (error) {
        return res.status(400).send({ error: error });
    }
});

router.post('/isAuthenticated', async (req, res) => {
    const { user } = req.body

    try {
        const db_user = await User.findById(user._id)

        if (user.session_id != db_user.session_id) {
            return res.status(403).send({ error: 'Múltiplos logins não são permitidos.' })
        }

        res.send({ data: true })
    } catch (error) {
        return res.status(400).send({ error: error })
    }
})

router.post('/refreshToken', async (req, res) => {
    const { user } = req.body;
    const { refreshToken } = user;

    try {
        jwt.verify(refreshToken, authConfig.refresh, (err, decoded) => {
            if (err) return res.status(401).send({ error: 'Token inválido' });

            res.send({
                token: generateToken({ user: user }),
                refreshToken: generateRefreshToken({ user: user })
            });
        });
    } catch (error) {
        return res.status(400).send({ error: error })
    }
})

router.post('/hideMessage', async (req, res) => {
    const { user } = req.body;

    try {
        const newUser = await User.findByIdAndUpdate(user._id, {
            welcome_message: false
        })

        return res.send({ newUser })

    } catch (error) {
        return res.status(400).send({ error: error })
    }
})

router.post('/sendemail', async (req, res) => {
    try {
        const email = await send()

        return res.send({ success: "Email enviado com sucesso", email: email })
    } catch (error) {
        return res.status(400).send({ error: error })
    }
})


const transporter = nodemailer.createTransport({
    host: SMTP_CONFIG.host,
    port: SMTP_CONFIG.port,
    secure: false,
    auth: {
        user: SMTP_CONFIG.user,
        pass: SMTP_CONFIG.pass
    },
    tls: {
        rejectUnauthorized: false
    }
});

async function send() {
    const mailSent = await transporter.sendMail({
        text: "Texto de teste do e-mail da easyquant.",
        subject: "Teste",
        from: "Easy Quant <easyquantapp.@gmail.com>",
        to: ['cefasgarciapereira@gmail.com']
    })

    return mailSent
}

function generateToken(params = {}) {
    return jwt.sign(params, authConfig.secret, {
        expiresIn: 86400,
    });
}

function generateRefreshToken(params = {}) {
    return jwt.sign(params, authConfig.refresh)
}

module.exports = app => app.use('/user', router);