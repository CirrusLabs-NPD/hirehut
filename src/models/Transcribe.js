const mongoose = require('mongoose')

const eventSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  transcribe: { type: String, required: true },
})

module.exports = mongoose.model('Transcribe', eventSchema)
