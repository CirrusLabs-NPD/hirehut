const express = require('express')
const router = express.Router()
const User = require('../models/User')
const { authMiddleware } = require('../middleware/authMiddleware')

// Protected route: Get current user
router.get('/profile', authMiddleware, async (req, res) => {
  const user = await User.findById(req.userId).select('-password')
  if (!user) return res.status(404).json({ message: 'User not found' })
  res.json(user)
})

module.exports = router
