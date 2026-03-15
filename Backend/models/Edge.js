const mongoose = require('mongoose');

const edgeSchema = new mongoose.Schema({
  from: { type: String, required: true },   // node id
  to: { type: String, required: true },     // node id
  weight: { type: Number, required: true }, // pixel distance between nodes
  isStair: { type: Boolean, default: false } // true if floor transition
});

module.exports = mongoose.model('Edge', edgeSchema);