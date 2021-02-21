const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URL, 
{ 
    useNewUrlParser: true, 
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
}).then(
    () => {console.log("Base de dados conectada.")},
    err => {console.log("Falha na conexão ao banco: "+err)}
);
mongoose.Promise = global.Promise;
module.exports = mongoose;