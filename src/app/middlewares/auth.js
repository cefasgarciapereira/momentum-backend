const jwt = require('jsonwebtoken');
const authConfig = require('../../config/auth.json');

module.exports = (req,res,next) => {
    const authHeader = req.headers.authorization;
    const nonSecurePaths = ['/login', '/logout']
    
    if (nonSecurePaths.includes(req.path)) 
        return next();

    if(!authHeader)
        return res.status(401).send({error: 'Nenhum token fornecido.'});
    
    const parts = authHeader.split(' ');

    if(!parts.length === 2)
        return res.status(401).send({error: 'Token mal formatado.'});
    
    const [scheme, token] = parts;
    
    if(!/^Bearer$/i.test(scheme))
        return res.status(401).send({error: 'Token com tipo inválido.'});
    
    jwt.verify(token, authConfig.secret, (err, decoded) => {
        if(err) return res.status(401).send({error: 'Token inválido'});

        req.userId = decoded.id;
        return next();
    });
};