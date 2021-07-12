const mongoose = require('../../database');

const StrategySchema = new mongoose.Schema({
    universe: {
        type: String,
        required: true,
    },
    type: {
        type: String
    },
    lookBack:{
        type: Number
    },
    portSize:{
        type: Number
    },
    response:{
        type: Array
    },
    date:{
        type: String,
    },
    datetime:{
        type: Date
    },
    hour:{
        type: String,
    }
},{collection: 'strategies'});

const Strategy = mongoose.model('Strategy', StrategySchema);
module.exports = Strategy;