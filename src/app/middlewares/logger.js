const Log = require('../models/log');

module.exports = async (req, res, next) => {
    const pathsToLog = ['/login']

    if (!pathsToLog.includes(req.path)) {
        return next();
    }

    const date = new Date();

    let log = {
        url: req.path,
        method: req.method,
        params: req.params,
        body: { ...req.body, password: '**********' },
        ip: req.headers['x-forwarded-for']?.split(',').shift() || req.socket?.remoteAddress,
        time: `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR')}`
    }

    try {
        await Log.create(log)
        return next();
    } catch (err) {
        console.log("Erro de log", err)
        return next();
    }
}