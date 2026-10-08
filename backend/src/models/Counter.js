const { Schema, model } = require('mongoose');
module.exports = model('Counter', new Schema({ _id: String, seq: { type: Number, default: 0 } }));
