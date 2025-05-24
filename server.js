const express = require('express');
const http = require('http');
const cors = require('cors')
const mongoose = require('mongoose');
const app = express();
const server = http.createServer(app);
require('dotenv').config()
app.use(cors('*'))
app.use(express.json()); // Required to parse JSON body

const port=process.env.PORT

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));


// Import and use routes
const setupRoutes = require('./src/app.module'); 
setupRoutes(app);

// Start the server on port 3001
server.listen(8000, () => {
  console.log(`Server started on http://localhost:${port}`);
});
