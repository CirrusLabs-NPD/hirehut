const express = require('express')
const router = express.Router()
const multer = require('multer')
const pdfParse = require('pdf-parse')
const fs = require('fs/promises')
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OpenAI = require('openai')
const Event = require('../models/Event')
const Job = require('../models/Job')
const User = require('../models/User')
const { v4: uuidv4 } = require('uuid')
const { authMiddleware } = require('../middleware/authMiddleware')
// Create OpenAI instance
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const hiresData = [
  ({
    Name: 'Onkar Jog',
    'Cell #': '647-657-8383',
    'Email ID': 'jogionkar@gmail.com',
    Client: 'Deloitte Global',
    AM: '',
    'Offer Date': '10/13/2023',
    'Start Date': '1/2/2024',
    Skills: 'Cloud Firewall Operations Engineer',
    'Hire Category': 'W2',
    'P&L Owner': '',
    Location: '',
  },
  {
    Name: 'Sridhar Ramalingam',
    'Cell #': '2019160013',
    'Email ID': 'SridharRamalinga@Gmail.com',
    Client: 'Elevance',
    AM: 'Krish',
    'Offer Date': '12/5/2023',
    'Start Date': '1/8/2024',
    Skills: 'Workday Integration Developer',
    'Hire Category': 'C2C',
    'P&L Owner': '',
    Location: '',
  },
  {
    Name: 'Daniel Gomez',
    'Cell #': '(401) 575-2021',
    'Email ID': 'danielgomez123@gmail.com',
    Client: 'Regions',
    AM: 'Zak',
    'Offer Date': '1/10/2024',
    'Start Date': 'Position Closed',
    Skills: '9672-1 QA/Test - Test Automation Engineer III',
    'Hire Category': 'W2',
    'P&L Owner': '',
    Location: '',
  },
  {
    Name: 'Sainagesh Veeravalli',
    'Cell #': '(470)-807-5170',
    'Email ID': 'nageshv.9832@gmail.com',
    Client: 'Elevance',
    AM: 'Krish',
    'Offer Date': 'Internal Employee',
    'Start Date': '',
    Skills: 'Internal Employee',
    'Hire Category': '',
    'P&L Owner': '',
    Location: '',
  },
  {
    Name: 'Saikiran Sistla',
    'Cell #': '904-933-6919',
    'Email ID': 'kiransistla1996@gmail.com',
    Client: 'Elevance',
    AM: 'Krish',
    'Offer Date': '1/16/2024',
    'Start Date': '',
    Skills: '',
    'Hire Category': 'C2C',
    'P&L Owner': '',
    Location: '',
  },
  {
    Name: 'Lamiaa Mourad',
    'Cell #': '(310) 310-4653',
    'Email ID': 'lamiaa.mourad.al@gmail.com',
    Client: 'Corp',
    AM: 'Santosh',
    'Offer Date': '2/20/2024',
    'Start Date': '2/26/2024',
    Skills: '',
    'Hire Category': 'W2',
    'P&L Owner': '',
    Location: '',
  }),
]

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

router.post('/agent', async (req, res) => {
  const { prompt } = req.body
  const { userId, username } = req
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' })

  try {
    // 1. Ask GPT to identify the schema and generate a query object
    const schemaChoicePrompt = `
    You are a backend engineer. Based on the user's prompt, do the following:
    
    1. Identify which MongoDB schema the query is about: "Job", "Event", or "User".
    2. Create a valid MongoDB filter (only the "filter" object, not a full query) that can be used with Mongoose.
    
    Consider this context:
    - The current user's MongoDB _id is: "${userId}"
    - Their username is: "${username}"
    - If the user asks for "my jobs", "my events", "jobs I posted", or similar, use filters like { postedBy: ObjectId } or { createdBy: ObjectId }.
    - If they ask for "meetings I’m in", use { "participants.email": "<their email>" } or "participants.name": "<username>" if email is unavailable.
    - Respond ONLY with a raw JSON object like:
    {
      "schema": "Job" | "Event" | "User",
      "filter": { ... }
    }
    
    MongoDB Schemas:
    
    Job: {
      title: String,
      description: String,
      skills: [String],
      experience: String,
      status: Boolean,
      location: String,
      salaryRange: { min: Number, max: Number },
      employmentType: String,
      postedBy: ObjectId
    }
    
    Event: {
      title: String,
      scheduledAt: Date,
      createdBy: ObjectId,
      participants: [{ name, email, role }],
      aiInstructions: String
    }
    
    User: {
      username: String,
      email: String
    }
    
    User's Prompt: "${prompt}"
    `

    const schemaResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'system', content: schemaChoicePrompt }],
      temperature: 0.1,
    })

    let content = schemaResponse.choices[0].message.content.trim()

    if (content.startsWith('```')) {
      content = content.replace(/^```(?:json)?\n/, '').replace(/\n```$/, '')
    }

    const parsed = JSON.parse(content)

    const { schema, filter } = parsed

    let results = []

    // 2. Run the query on the chosen schema
    if (schema === 'Job') {
      results = await Job.find(filter).limit(10).lean()
    } else if (schema === 'Event') {
      results = await Event.find(filter).limit(10).lean()
    } else if (schema === 'User') {
      results = await User.find(filter).limit(10).lean()
    } else {
      return res.status(400).json({ error: 'Invalid schema returned from GPT' })
    }

    // 3. Ask GPT to answer based on those results
    const finalAnswerPrompt = `
Use the following MongoDB query result to answer the user's question:

Prompt: "${prompt}"
Schema: ${schema}
Results: ${JSON.stringify(results, null, 2)}

Answer the prompt naturally using only the results.
If no matching data is found, say "No matching data found."
`

    const finalResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'system', content: finalAnswerPrompt }],
      temperature: 0.3,
    })

    const answer = finalResponse.choices[0]?.message?.content?.trim()
    res.json({ answer: answer || 'No response from AI.' })
  } catch (err) {
    console.error('Agent error:', err.message)
    res.status(500).json({ error: 'Agent failed', details: err.message })
  }
})

router.post('/agent', async (req, res) => {
  const { prompt } = req.body
  const { userId, username } = req
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' })

  try {
    // 1. Ask GPT to identify the schema and generate a query object
    const schemaChoicePrompt = `
    You are a backend engineer. Based on the user's prompt, do the following:
    
    1. Identify which MongoDB schema the query is about: "Job", "Event", or "User".
    2. Create a valid MongoDB filter (only the "filter" object, not a full query) that can be used with Mongoose.
    
    Consider this context:
    - The current user's MongoDB _id is: "${userId}"
    - Their username is: "${username}"
    - If the user asks for "my jobs", "my events", "jobs I posted", or similar, use filters like { postedBy: ObjectId } or { createdBy: ObjectId }.
    - If they ask for "meetings I’m in", use { "participants.email": "<their email>" } or "participants.name": "<username>" if email is unavailable.
    - Respond ONLY with a raw JSON object like:
    {
      "schema": "Job" | "Event" | "User",
      "filter": { ... }
    }
    
    MongoDB Schemas:
    
    Job: {
      title: String,
      description: String,
      skills: [String],
      experience: String,
      status: Boolean,
      location: String,
      salaryRange: { min: Number, max: Number },
      employmentType: String,
      postedBy: ObjectId
    }
    
    Event: {
      title: String,
      scheduledAt: Date,
      createdBy: ObjectId,
      participants: [{ name, email, role }],
      aiInstructions: String
    }
    
    User: {
      username: String,
      email: String
    }
    
    User's Prompt: "${prompt}"
    `

    const schemaResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'system', content: schemaChoicePrompt }],
      temperature: 0.1,
    })

    let content = schemaResponse.choices[0].message.content.trim()

    if (content.startsWith('```')) {
      content = content.replace(/^```(?:json)?\n/, '').replace(/\n```$/, '')
    }

    const parsed = JSON.parse(content)

    const { schema, filter } = parsed

    let results = []

    // 2. Run the query on the chosen schema
    if (schema === 'Job') {
      results = await Job.find(filter).limit(10).lean()
    } else if (schema === 'Event') {
      results = await Event.find(filter).limit(10).lean()
    } else if (schema === 'User') {
      results = await User.find(filter).limit(10).lean()
    } else {
      return res.status(400).json({ error: 'Invalid schema returned from GPT' })
    }

    // 3. Ask GPT to answer based on those results
    const finalAnswerPrompt = `
Use the following MongoDB query result to answer the user's question:

Prompt: "${prompt}"
Schema: ${schema}
Results: ${JSON.stringify(results, null, 2)}

Answer the prompt naturally using only the results.
If no matching data is found, say "No matching data found."
`

    const finalResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'system', content: finalAnswerPrompt }],
      temperature: 0.3,
    })

    const answer = finalResponse.choices[0]?.message?.content?.trim()
    res.json({ answer: answer || 'No response from AI.' })
  } catch (err) {
    console.error('Agent error:', err.message)
    res.status(500).json({ error: 'Agent failed', details: err.message })
  }
})

const upload = multer({ storage: multer.memoryStorage() })

router.post('/match-resumes', upload.array('resumes'), async (req, res) => {
  const jobDescription = req.body.jobDescription
  const files = req.files

  if (!jobDescription || files.length === 0) {
    return res
      .status(400)
      .json({ error: 'Job description and at least one resume are required' })
  }

  try {
    // 1. Extract text from each resume
    const resumeTexts = await Promise.all(
      files.map(async (file) => {
        const data = await pdfParse(file.buffer)
        return {
          filename: file.originalname,
          text: data.text,
        }
      })
    )

    // 2. Ask GPT to return JSON with match data
    const prompt = `
You are a resume screening engine. Given a job description and multiple resumes, return a structured JSON array with the following fields per resume:

- "name": Full name of the candidate (if not found, use filename)
- "email": Email found in the resume (if not found, return "Not found")
- "matchingScore": A number between 0 and 100 based on how well the resume matches the job description.
- "summary": A 1–2 line summary of the candidate’s profile.

Format your entire response as raw JSON array, like:
[
  {
    "name": "Jane Doe",
    "email": "jane.doe@example.com",
    "matchingScore": 87,
    "summary": "Experienced frontend developer with 5 years in React and UI design."
  },
  ...
]

Job Description:
${jobDescription}

Resumes:
${resumeTexts
  .map(
    (r, i) =>
      `Resume ${i + 1} (${r.filename}):\n${r.text.substring(0, 2000)}\n...`
  )
  .join('\n\n')}
    `.trim()

    const matchResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'system', content: prompt }],
      temperature: 0.2,
    })

    let raw = matchResponse.choices[0].message.content.trim()

    if (raw.startsWith('```')) {
      raw = raw.replace(/^```(?:json)?\n/, '').replace(/\n```$/, '')
    }

    const structuredResult = JSON.parse(raw)

    // Schedule events for high match scores (> 80)
    const topCandidates = structuredResult.filter((c) => c.matchingScore > 80)

    if (topCandidates.length > 0) {
      const scheduledAt = new Date()
      scheduledAt.setDate(scheduledAt.getDate() + 1) // Schedule for tomorrow

      const end = new Date(scheduledAt.getTime() + 30 * 60000) // 30 minutes later

      await Promise.all(
        topCandidates.map(async (candid) => {
          try {
            const event = new Event({
              title: `${candid.name} (AI Interview)`,
              scheduledAt,
              createdBy: '6834af991cdef2ca33698434', // Replace with actual ObjectId if needed
              participants: [
                { name: candid.name, email: candid.email, role: 'candidate' },
              ],
              aiInstructions: `Use the following job description to interview:\n\n${jobDescription}`,
              metadata: {
                candidate: candid,
                roomId: uuidv4(),
                start: scheduledAt,
                end: end,
                duration: 30,
                mode: 'AI', // or another default value you use
              },
            })

            await event.save()
            console.log(`Event saved for ${candid.name}`)
          } catch (err) {
            console.error(`Error saving event for ${candid.name}:`, err.message)
          }
        })
      )
    }

    res.json({ matchResults: structuredResult })
  } catch (err) {
    console.error('Matching error:', err)
    res
      .status(500)
      .json({ error: 'Failed to process resumes', details: err.message })
  }
})

module.exports = router
