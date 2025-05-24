// models/Job.js
const mongoose = require('mongoose')

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: false,
    trim: true,
  },
  skills: {
    type: [String], // array of skills
    required: true,
    default: [],
  },
  experience: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: Boolean,
    default: true, // true = active, false = inactive
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  company: {
    type: String,
    trim: true,
  },
  location: {
    type: String,
    trim: true,
  },
  salaryRange: {
    min: { type: Number },
    max: { type: Number },
  },
  employmentType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary'],
    default: 'Full-time',
  },
  industry: {
    type: String,
  },
  tags: {
    type: [String],
    default: [],
  },
  deadline: {
    type: Date,
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  applications: {
    type: Number,
    default: 0,
  },
  views: {
    type: Number,
    default: 0,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'internal'],
    default: 'public',
  },
})

module.exports = mongoose.model('Job', jobSchema)
