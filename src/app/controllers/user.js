const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/user.js');
const CloseFriends = require('../models/closeFriends.js');
const jwt = require('jsonwebtoken');
const authConfig = require('../../config/auth.json');
const authMiddleware = require('../middlewares/auth');
const loggerMiddleware = require('../middlewares/logger');
const nodemailer = require('nodemailer');
const SMTP_CONFIG = require('../../config/smtp');
const stripe = require('../services/stripe');

const router = express.Router();

router.use('/', authMiddleware);
router.use('/', loggerMiddleware);

router.post('/registerWithCloseFriends', async (req, res) => {
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
            refresh_token: generateRefreshToken({ email: email }),
            is_closefriends: true,
            active: true
        });

        return res.send({
            token: generateToken({
                user,
                token: generateToken({ user: user }),
                refreshToken: generateRefreshToken({ user: user })

            })
        });
    } catch (error) {
        return res.status(400).send({ error: `Falha no cadastro: ${error.message}` });
    }
});

router.post('/registerAndSubscribe', async (req, res) => {
    const {
        email,
        name,
        plan_id,
        card_name,
        card_number,
        card_exp_month,
        card_exp_year,
        card_cvc,
        city,
        country,
        line,
        state,
        phone,
        postal_code,
        coupon
    } = req.body;

    try {
        if (await User.findOne({ email }))
            return res.status(400).send({ error: 'Email já cadastrado.' });

        const session_id = bcrypt.genSaltSync(10);
        const refresh_token = generateRefreshToken({ email: email })

        //create payment method
        const paymentMethod = await stripe.paymentMethods.create({
            type: 'card',
            card: {
                number: card_number,
                exp_month: card_exp_month,
                exp_year: card_exp_year,
                cvc: card_cvc
            },
            billing_details: {
                address: {
                    city: city,
                    country: country,
                    line1: line,
                    postal_code: postal_code,
                    state: state
                },
                email: email,
                name: card_name,
                phone: phone
            },
        });

        //create a customer
        const customer = await stripe.customers.create({
            name: name,
            email: email,
            payment_method: paymentMethod.id,
            invoice_settings: {
                default_payment_method: paymentMethod.id
            },
            phone: phone,
            address: {
                city: city,
                country: country,
                line1: line,
                postal_code: postal_code,
                state: state
            }
        });

        //create subscription
        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            default_payment_method: paymentMethod.id,
            items: [
                { price: plan_id },
            ],
            trial_period_days: 7,
            coupon: coupon,
        });

        user = await User.create({
            ...req.body,
            session_id: session_id,
            refresh_token: refresh_token,
            payment_method_id: paymentMethod.id,
            customer_id: customer.id,
            subscription_id: subscription.id,
            active: true
        });

        return res.send({
            token: generateToken({
                user
            })
        });

    } catch (error) {

        if (error.message.includes("No such coupon")) {
            return res.status(400).send({ error: `Falha no cadastro: cupom inválido` })
        }

        return res.status(400).send({ error: `Falha no cadastro (${error.name}): ${error.message}` });
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

        const active = await isUserActive(user)

        user.password = undefined;
        user.session_id = session_id;
        user._doc.active = active
        res.send({
            token: generateToken({ user: user }),
        });
    } catch (error) {
        return res.status(400).send({ error: error });
    }
});

router.post('/update', async (req, res) => {
    const { email, user } = req.body;

    try {
        await User.findOneAndUpdate({ email }, { ...user })
        const updatedUser = await User.findOne({ email })

        res.send({
            token: generateToken({ user: updatedUser }),
        });

    } catch (error) {
        return res.status(400).send({ error: error });
    }
})

router.post('/updatePassword', async (req, res) => {
    const { email, newPassword } = req.body;

    try {
        let user = await User.findOne({ email }).select('+password');

        if (!user)
            return res.status(400).send({ error: 'Usuário não encontrado.' });

        const hash = await bcrypt.hash(newPassword, 10);

        await User.findOneAndUpdate({ email }, {
            password: hash
        })

        const updatedUser = await User.findOne({ email })

        res.send({
            token: generateToken({ user: updatedUser }),
        });

    } catch (error) {
        return res.status(400).send({ error: `Erro ao atualizar senhas ${error}` });
    }
})

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
    const { refresh_token } = user;

    let newUser = { ...user, active: await isUserActive(user) }

    try {
        jwt.verify(refresh_token, authConfig.refresh, (err, decoded) => {
            if (err) return res.status(401).send({ error: 'Token inválido' });

            res.send({
                token: generateToken({ user: newUser }),
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

router.post('/requestNewPassword', async (req, res) => {
    const { email, env } = req.body;

    try {
        let user = await User.findOne({ email })

        if (!user)
            return res.status(400).send({ error: 'Usuário não encontrado.' });

        const token = generateNewPassToken()
        const baseUrl = env === 'prod' ? "https://www.easyquant.com.br" :
            env === 'homolog' ? "http://homolog-easyquant.netlify.app" : 'http://localhost:3000'
        const resetURL = `${baseUrl}/nova-senha?token=${token}&email=${email}`

        const message = `Olá ${user.name.split(' ')[0]}, você solicitou uma troca de senha. Utilize o link abaixo para resetá-la. \n\n${resetURL}`

        const sentMail = await send({
            to: user.email,
            subject: 'Recuperar Senha - Easy Quant',
            text: message
        })

        return res.send({ success: "Email enviado com sucesso", email: sentMail })

    } catch (error) {
        return res.status(400).send({ error: error })
    }
})

router.post('/resetPassword', async (req, res) => {
    const { email, token, newPassword } = req.body;

    try {
        const user = await User.findOne({ email })

        if (!newPassword)
            return res.status(400).send({ error: 'É necessário informar uma nova senha.' });

        if (!user)
            return res.status(400).send({ error: 'Usuário não encontrado.' });

        if (!token)
            return res.status(401).send({ error: 'Nenhum token fornecido.' });

        jwt.verify(token, authConfig.newPass, (err) => {
            if (err) return res.status(401).send({ error: 'Token inválido' });
        });

        const hash = await bcrypt.hash(newPassword, 10);

        await User.findOneAndUpdate({ email }, {
            password: hash
        })

        return res.send({ success: "Senha alterada com sucesso" })

    } catch (error) {
        return res.status(400).send({ error: `Erro inesperado no servidor ${error}` })
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

router.post('/subscribe', async (req, res) => {
    const { credit_card } = req.body
    try {
        //create payment method
        const paymentMethod = await stripe.paymentMethods.create({
            type: 'card',
            card: {
                number: credit_card.number,
                exp_month: credit_card.exp_month,
                exp_year: credit_card.exp_year,
                cvc: credit_card.cvc,
            },
        });

        //create a costumer
        const customer = await stripe.customers.create({
            name: req.body.name,
            email: req.body.email,
            payment_method: paymentMethod.id,
            invoice_settings: {
                default_payment_method: paymentMethod.id
            }
        });

        //create subscription
        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [
                { price: 'price_1In5oRIoqiuDenozaQ0lNzeP' }, // plan id
            ],
            trial_period_days: 7
        });

        return res.send({ subscription })
    } catch (error) {
        return res.status(400).send({ error: `Falha na assinatura ${error}` })
    }
})

router.post('/cancelSubscription', async (req, res) => {
    const { subscription_id } = req.body;

    try {
        const canceled = await stripe.subscriptions.update(
            subscription_id,
            {
                cancel_at_period_end: true
            });

        return res.send({ canceled })
    } catch (error) {
        return res.status(400).send({ error: `Falha ao cancelar assinatura ${error}` })
    }
})

router.post('/reactivateSubscription', async (req, res) => {
    const { subscription_id, plan_id } = req.body;

    try {

        const subscription = await stripe.subscriptions.retrieve(subscription_id);

        const updated_subscription = await stripe.subscriptions.update(
            subscription_id,
            {
                cancel_at_period_end: false,
                proration_behavior: 'create_prorations',
                items: [{
                    id: subscription.items.data[0].id,
                    price: plan_id,
                }]
            });

        return res.send({ updated_subscription })

    } catch (error) {
        return res.status(400).send({ error: `Falha ao cancelar assinatura ${error}` })
    }
})

router.get('/costumer', async (req, res) => {
    const { customer_id } = req.query;

    try {
        const customer = await stripe.customers.retrieve(
            customer_id
        );

        return res.send({ customer })
    } catch (error) {
        return res.status(400).send({ error: `Falha ao buscar cliente ${error}` })
    }
})

router.get('/subscription', async (req, res) => {
    const { subscription_id } = req.query;

    try {
        const subscription = await stripe.subscriptions.retrieve(
            subscription_id
        );

        return res.send({ subscription })
    } catch (error) {
        return res.status(400).send({ error: `Falha ao buscar assinatura ${error}` })
    }
})

router.get('/payment_methods', async (req, res) => {
    const { payment_method_id } = req.query;

    try {
        const paymentMethod = await stripe.paymentMethods.retrieve(
            payment_method_id
        );

        return res.send({ paymentMethod })
    } catch (error) {
        return res.status(400).send({ error: `Falha ao buscar método de pagamento ${error}` })
    }
})

router.post('/cancel_subscription', async (req, res) => {
    const { subscription_id } = req.body;

    try {
        await stripe.subscriptions.update(subscription_id, { cancel_at_period_end: true });

        return res.send({ success: "ok" })
    } catch (error) {
        return res.status(400).send({ error: `Falha ao cancelar a assinatura ${error}` })
    }
})

router.post('/reactivate_subscription', async (req, res) => {
    const { subscription_id } = req.body;

    try {
        const subscription = await stripe.subscriptions.retrieve(subscription_id);

        await stripe.subscriptions.update(subscription_id, {
            cancel_at_period_end: false,
            proration_behavior: 'create_prorations',
            items: [{
                id: subscription.items.data[0].id,
                price: subscription.items.data[0].price.id,
            }]
        });

        return res.send({ success: "ok" })
    } catch (error) {
        return res.status(400).send({ error: `Falha ao reativar a assinatura ${error}` })
    }
})

router.post('/change_plan', async (req, res) => {
    const { subscription_id, price_id } = req.body;

    try {
        const subscription = await stripe.subscriptions.retrieve(subscription_id);

        stripe.subscriptions.update(subscription_id, {
            cancel_at_period_end: false,
            proration_behavior: 'create_prorations',
            items: [{
                id: subscription.items.data[0].id,
                price: price_id,
            }]
        });

        return res.send({ subscription })
    } catch (error) {
        return res.status(400).send({ error: `Falha ao atualizar assinatura ${error}` })
    }
})

router.post('/edit_credit_card', async (req, res) => {
    const {
        customer_id,
        payment_method_id,
        card_name,
        card_number,
        card_expiry,
        card_cvc,
    } = req.body;

    try {
        card_exp_month = card_expiry.split('/')[0]
        card_exp_year = card_expiry.split('/')[1]

        // retrieve current payment method
        const currentPaymentMethod = await stripe.paymentMethods.retrieve(payment_method_id)

        //create new payment method
        const paymentMethod = await stripe.paymentMethods.create({
            type: 'card',
            card: {
                number: card_number,
                exp_month: card_exp_month,
                exp_year: card_exp_year,
                cvc: card_cvc
            },

            billing_details: {
                ...currentPaymentMethod.billing_details,
                name: card_name
            }

        });

        // attach new payment method to the customer
        await stripe.paymentMethods.attach(
            paymentMethod.id,
            { customer: customer_id }
        );

        // update customer with new default payment method
        const customer = await stripe.customers.update(
            customer_id,
            { invoice_settings: { default_payment_method: paymentMethod.id } }
        );

        return res.send({ customer })
    }
    catch (error) {
        return res.status(400).send({ error: `Falha ao atualizar forma de pagamento: ${error.message}` })
    }
})

router.post('/search-coupon', async (req, res) => {
    const {
        coupon
    } = req.body;

    try {
        const res_coupon = await stripe.coupons.retrieve(
            coupon
        );

        return res.send({ res_coupon })
    }
    catch (error) {
        return res.status(400).send({ error: `Cupon inválido` })
    }
})

const transporter = nodemailer.createTransport({
    host: SMTP_CONFIG.host,
    port: SMTP_CONFIG.port,
    secure: true,
    auth: {
        user: SMTP_CONFIG.user,
        pass: SMTP_CONFIG.pass
    },
    tls: {
        rejectUnauthorized: false
    }
});

async function send({ to, text, subject }) {
    const mailSent = await transporter.sendMail({
        text: text,
        subject: subject,
        from: "Easy Quant <contato@easyquant.com.br>",
        to: [to]
    })

    return mailSent
}

async function isUserActive(user) {
    if (user.is_closefriends) {
        return true
    }

    if (user.subscription_id) {
        const subscription = await stripe.subscriptions.retrieve(user.subscription_id);
        const status = subscription.status
        return (status === 'active' || status === 'trialing') ? true : false
    }

    return false
}

function generateToken(params = {}) {
    return jwt.sign(params, authConfig.secret, {
        expiresIn: 86400,
    });
}

function generateRefreshToken(params = {}) {
    return jwt.sign(params, authConfig.refresh)
}

function generateNewPassToken(params = {}) {
    return jwt.sign(params, authConfig.newPass, {
        expiresIn: 900
    })
}

module.exports = app => app.use('/user', router);