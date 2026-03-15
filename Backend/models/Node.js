const mongoose = require('mongoose');

const nodeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // e.g. "J014"
  label: { type: String, required: true },            // display name
  type: {
    type: String,
    enum: ['room', 'corridor', 'stairs', 'washroom', 'lab', 'garden', 'faculty'],
    default: 'room'
  },
  floor: { type: Number, required: true },  // 0 = ground, 1 = first
  x: { type: Number, required: true },      // pixel x on map
  y: { type: Number, required: true },      // pixel y on map
});

module.exports = mongoose.model('Node', nodeSchema);