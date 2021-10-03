const Log = require('../models/log');

module.exports = async (req, res, next) => {
    const pathsToLog = [
        '/registerWithCloseFriends',
        '/registerAndSubscribe',
        '/login',
        '/update',
        '/reactivate_subscription',
        '/change_plan'
    ]

    if (!pathsToLog.includes(req.path)) {
        return next();
    }

    const date = new Date();
    const origin = req.headers.host || req.headers.origin || req.headers.hostname;

    let log = {
        url: req.path,
        method: req.method,
        params: req.params,
        body: { ...req.body, password: '**********', password_confirmation: '**********' },
        ip: req.headers['x-forwarded-for']?.split(',').shift() || req.socket?.remoteAddress,
        time: `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR')}`,
        origin: `${origin}`,
    }

    try {
        await Log.create(log)
        return next();
    } catch (err) {
        console.log("Erro de log", err)
        return next();
    }
}