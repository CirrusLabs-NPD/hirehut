const express = require('express')
const router = express.Router()
const Event = require('../models/Event')
const Transcribe = require('../models/Transcribe')
const { authMiddleware } = require('../middleware/authMiddleware')
const { v4: uuidv4 } = require('uuid')
// Get all events for logged-in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const events = await Event.find()
    res.json(events)
  } catch (err) {
    res.status(500).json({ message: 'Error fetching events' })
  }
})

// Create a new event
router.post('/', authMiddleware, async (req, res) => {
  const { title, scheduledAt, participants, aiInstructions, metadata } =
    req.body

  if (!title || !scheduledAt) {
    return res
      .status(400)
      .json({ message: 'Title and scheduledAt are required' })
  }

  try {
    const event = new Event({
      title,
      scheduledAt,
      createdBy: req.userId,
      participants,
      aiInstructions,
      metadata: { ...metadata, roomId: uuidv4() },
    })

    await event.save()
    res.status(201).json(event)
  } catch (err) {
    res
      .status(500)
      .json({ message: 'Error creating event', error: err.message })
  }
})

// Update an event
router.put('/:id', async (req, res) => {
  const { id } = req.params
  const { title, scheduledAt, participants, aiInstructions, metadata } =
    req.body

  try {
    const updatedEvent = await Event.findOneAndUpdate(
      { _id: id },
      { title, scheduledAt, participants, aiInstructions, metadata },
      { new: true }
    )

    if (!updatedEvent) {
      return res
        .status(404)
        .json({ message: 'Event not found or unauthorized' })
    }

    res.json(updatedEvent)
  } catch (err) {
    res
      .status(500)
      .json({ message: 'Error updating event', error: err.message })
  }
})

// Delete an event
router.delete('/:id', async (req, res) => {
  const { id } = req.params

  try {
    const deletedEvent = await Event.findOneAndDelete({
      _id: id,
    })

    if (!deletedEvent) {
      return res
        .status(404)
        .json({ message: 'Event not found or unauthorized' })
    }

    res.json({ message: 'Event deleted successfully' })
  } catch (err) {
    res
      .status(500)
      .json({ message: 'Error deleting event', error: err.message })
  }
})

router.post('/store-transcribs', async (req, res) => {
  const { transcribe, roomId } = req.body
  console.log('storing')
  if (!roomId || !transcribe) {
    return res
      .status(400)
      .json({ message: 'roomId and transcribs are required' })
  }

  try {
    const existing = await Transcribe.findOne({ roomId })

    if (existing) {
      // Append new transcribs to existing
      existing.transcribe += ' ' + transcribe
      await existing.save()
      return res
        .status(200)
        .json({ message: 'Transcription updated', data: existing })
    } else {
      // Create new record
      const newEntry = new Transcribe({ roomId, transcribe })
      await newEntry.save()
      return res
        .status(201)
        .json({ message: 'Transcription created', data: newEntry })
    }
  } catch (err) {
    console.error('Error storing transcriptions:', err)
    res.status(500).json({ message: 'Internal server error' })
  }
})

router.get('/transcribs/:roomId', async (req, res) => {
  const { roomId } = req.params
  if (!roomId) {
    return res.status(400).json({ message: 'roomId is required' })
  }

  try {
    const existing = await Transcribe.findOne({ roomId })

    if (existing) {
      return res
        .status(200)
        .json({ message: 'Transcription found', data: existing })
    } else {
      // Create new record

      return res
        .status(201)
        .json({ message: 'Transcription not found', data: null })
    }
  } catch (err) {
    console.error('Error storing transcriptions:', err)
    res.status(500).json({ message: 'Internal server error' })
  }
})

module.exports = router
