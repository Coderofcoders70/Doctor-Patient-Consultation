const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  // Get the authorization header
  const authHeader = req.headers['authorization'];
  
  // Extract the token
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    // verify the token using your secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach the decoded payload userId and role to the request object
    req.user = decoded; 
    
    // Pass control to the next middleware or controller
    next();
    
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

module.exports = authenticateToken;