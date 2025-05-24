const userRoutes = require('./routes/user')
const authRoutes = require('./routes/auth')
const eventRoutes = require('./routes/events')
const openaiRoutes = require('./routes/openai')
const jobRoutes = require('./routes/jobs')
module.exports = function (app) {
  app.get('/health', (req, res) => {
    res.send('Healthy')
  })
  app.use('/api/user', userRoutes)
  app.use('/api/auth', authRoutes)
  app.use('/api/events', eventRoutes)
  app.use('/api/openai', openaiRoutes)
  app.use('/api/jobs', jobRoutes)
}
