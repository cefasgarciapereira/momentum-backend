const mongoose = require('../../database');

const ApiLogSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true,
    },
    method: {
        type: String,
        required: true,
    },
    params: {
        type: Object
    },
    body: {
        type: Object
    },
    origin: {
        type: String
    },
    ip: {
        type: String,
        required: true,
    },
    time: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

const Log = mongoose.model('ApiLog', ApiLogSchema);
module.exports = Log;