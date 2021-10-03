const jwt = require('jsonwebtoken');
const authConfig = require('../../config/auth.json');

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const nonSecurePaths = [
        '/register',
        '/registerWithCloseFriends',
        '/registerAndSubscribe',
        '/login',
        '/logout',
        '/requestNewPassword',
        '/resetPassword',
        '/stripe',
        '/subscribe',
        '/costumer',
        '/subscription',
        '/refreshToken',
        '/close-friends/add',
        '/search-coupon'
    ]

    const ref = req.header('Referer') || 'undefined';

    if (!checkOrigin(ref))
        return res.status(401).send({ error: 'Acesso não autorizado' });

    if (nonSecurePaths.includes(req.path))
        return next();

    if (!authHeader)
        return res.status(401).send({ error: 'Nenhum token fornecido.' });

    const parts = authHeader.split(' ');

    if (!parts.length === 2)
        return res.status(401).send({ error: 'Token mal formatado.' });

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme))
        return res.status(401).send({ error: 'Token com tipo inválido.' });

    jwt.verify(token, authConfig.secret, (err, decoded) => {
        if (err) return res.status(401).send({ error: 'Token inválido' });

        req.userId = decoded.id;
        return next();
    });
};

function checkOrigin(origin) {
    let allowedDomains = [
        'https://www.easyquant.com.br',
        'http://www.easyquant.com.br',
        'easyquant.com.br',
        'https://homolog-easyquant.netlify.app',
        'http://homolog-easyquant.netlify.app',
        'homolog-easyquant.netlify.app'
    ]

    if (process.env.SERVER_ENV === 'DEV') {
        allowedDomains.push('localhost:9000')
    }

    if (allowedDomains.includes(origin)) {
        return true;
    } else {
        return false;
    }

}