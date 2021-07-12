const mongoose = require('../../database');

const TickerSchema = new mongoose.Schema({
    ticker:{
        type: String
    },
    date: {
        type: Date,
    },
    type: {
        type: String
    },
    response:{
        type: Array
    }
},{collection: 'tickers_data'});

const Ticker = mongoose.model('Ticker', TickerSchema);
module.exports = Ticker;