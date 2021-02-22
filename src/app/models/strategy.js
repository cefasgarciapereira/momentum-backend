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
        type: Date,
        default: Date.now,
    },
    hour:{
        type: Date,
        default: Date.now
    }
},{collection: 'strategies_records'});

const Strategy = mongoose.model('Strategy', StrategySchema);
module.exports = Strategy;