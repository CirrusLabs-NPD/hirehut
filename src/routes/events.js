const express = require('express')
const router = express.Router()
const Event = require('../models/Event')
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

module.exports = router
