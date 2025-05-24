const express = require('express')
const router = express.Router()

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OpenAI = require('openai')
const Job = require('../models/Job')

// Create OpenAI instance
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

async function createRealtimeSession() {
  try {
    const response = await fetch(
      'https://api.openai.com/v1/realtime/sessions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-realtime-preview',
          modalities: ['audio', 'text'],
          instructions:
            'You are a technical panel who will be interviewing the candidate in call.Just start the converstation with basic question so the candidate introduce themselv and then ask for their technical skills and keep asking right questions to evaluate them.Start with a small but sweet welcome ,and your introduction.Your name is Lily ',
        }),
      }
    )

    if (!response.ok) {
      throw new Error(
        `HTTP Error: ${response.status} - ${await response.text()}`
      )
    }

    const data = await response.json()
    console.log('Session Created:', data)
    return data
  } catch (error) {
    console.error('Error creating session:', error.message)
    throw error
  }
}

router.get('/realtime/session', async (req, res) => {
  const response = await createRealtimeSession()
  const { client_secret } = response
  res.send(client_secret)
})

router.post('/createjob', async (req, res) => {
  const { prompt } = req.body
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' })

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // or 'gpt-4o-mini' if available
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant that extracts job details from a job description prompt.
          
          Respond ONLY with a JSON object strictly matching this schema:
          
          {
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  skills: {
    type: [String], // array of skills
    required: true,
    default: []
  },
  experience: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: Boolean,
    default: true // true = active, false = inactive
  },
  createdAt: {
    type: Date,
    default: Date.now
    },
    company: {
        type: String,
        trim: true
      },
      location: {
        type: String,
        trim: true
      },
      salaryRange: {
        min: { type: Number },
        max: { type: Number }
      },
      employmentType: {
        type: String,
        enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary'],
        default: 'Full-time'
      },
      industry: {
        type: String
      },
      tags: {
        type: [String],
        default: []
      },
      deadline: {
        type: Date
      },
      postedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      applications: {
        type: Number,
        default: 0
      },
      views: {
        type: Number,
        default: 0
      },
      updatedAt: {
        type: Date,
        default: Date.now
      },
      isFeatured: {
        type: Boolean,
        default: false
      },
      visibility: {
        type: String,
        enum: ['public', 'private', 'internal'],
        default: 'public'
      }
}
          
          If a value is unknown, use an empty string, empty array, null, or a reasonable default.
          Always add a descrption based on the job info if not provided by user.
          IMPORTANT: Do NOT include any explanation, markdown, triple backticks, or "json" label. Your output must start with { and end with } only.`,
        },
        {
          role: 'user',
          content: `Extract job details from this prompt:\n\n${prompt}\n\nRespond ONLY with valid JSON.`,
        },
      ],
      temperature: 0.2,
    })

    const aiContent = completion.choices[0]?.message?.content
    let jobData

    try {
      jobData = JSON.parse(aiContent)
    } catch (jsonErr) {
      return res.status(400).json({
        error: 'Invalid JSON from AI response',
        details: jsonErr.message,
        raw: aiContent,
      })
    }

    jobData.createdAt = new Date()
    jobData.updatedAt = new Date()

    const job = new Job(jobData)
    await job.save()

    res.status(201).json(job)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
