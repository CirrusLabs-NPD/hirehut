const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  scheduledAt: { type: Date, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  participants: [{
    name: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, required: true },
  }],
  aiInstructions: { type: String },
  metadata: { type: Object },
})

module.exports = mongoose.model('Event', eventSchema)
