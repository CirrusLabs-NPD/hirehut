const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// Function to generate JWT token
function generateToken(user) {
  const payload = {
    id: user._id,         // User's ID
    username: user.username,  // User's username
  };

  // Generate and return the JWT token
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
  return token;
}

// Authentication middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  // Check if the Authorization header is valid
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];  // Extract token

  try {
    const decoded = jwt.verify(token, JWT_SECRET);  // Verify token
    req.userId = decoded.id;      // Attach user ID to request object
    req.username = decoded.username; // Attach username to request object
    next();  // Proceed to the next middleware or route handler
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });  // Token verification failed
  }
}

module.exports = { authMiddleware, generateToken };
