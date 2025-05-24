// routes/jobRoutes.js
const express = require('express')
const router = express.Router()
const Job = require('../models/Job')

// Get all jobs (optionally you can add query params for filtering, pagination later)
router.get('/', async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 })
    res.json(jobs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get job by ID
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
    if (!job) return res.status(404).json({ error: 'Job not found' })
    res.json(job)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
// Create a new job
router.post('/', async (req, res) => {
  try {
    const job = new Job(req.body)
    await job.save()
    res.status(201).json(job)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// Edit existing job by ID
router.put('/:id', async (req, res) => {
  try {
    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
    if (!updatedJob) return res.status(404).json({ error: 'Job not found' })
    res.json(updatedJob)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// Enable a job (status = true)
router.patch('/:id/enable', async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { status: true, updatedAt: new Date() },
      { new: true }
    )
    if (!job) return res.status(404).json({ error: 'Job not found' })
    res.json(job)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// Disable a job (status = false)
router.patch('/:id/disable', async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { status: false, updatedAt: new Date() },
      { new: true }
    )
    if (!job) return res.status(404).json({ error: 'Job not found' })
    res.json(job)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

module.exports = router
