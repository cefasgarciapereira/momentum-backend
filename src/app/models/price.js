const mongoose = require('../../database');

const PriceSchema = new mongoose.Schema({
    date: {
        type: Date,
    },
    index: {
        type: String
    },
    prices:{
        type: Array
    }
},{collection: 'prices'});

const Price = mongoose.model('Price', PriceSchema);
module.exports = Price;