const userRoutes = require('./routes/user')
const authRoutes = require('./routes/auth')
const eventRoutes = require('./routes/events')
const openaiRoutes = require('./routes/openai')
const jobRoutes = require('./routes/jobs')
const path = require('path')
const express = require('express')
module.exports = function (app) {
  app.use(express.static(path.join(__dirname, 'build')))
  app.use('/api/user', userRoutes)
  app.use('/api/auth', authRoutes)
  app.use('/api/events', eventRoutes)
  app.use('/api/openai', openaiRoutes)
  app.use('/api/jobs', jobRoutes)

  // Catch-all: send index.html for other routes (SPA support)
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'))
  })
}
