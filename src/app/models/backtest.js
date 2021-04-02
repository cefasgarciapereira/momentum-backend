const mongoose = require('../../database');

const BacktestSchema = new mongoose.Schema({
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
    ind:{
        type: Array
    },
    stats:{
        type: Array,
    },
    datetime:{
        type: Date
    }
},{collection: 'backtest'});

const Backtest = mongoose.model('Backtest', BacktestSchema);
module.exports = Backtest;