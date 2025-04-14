const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET ;

// Generate JWT token
const generateToken = (employee) => {
  return jwt.sign(
    {
      employee_id: employee.employee_id,
      email: employee.email,
      role: employee.role
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Compare password
const comparePassword = async (plainText, hash) => {
  return await bcrypt.compare(plainText, hash);
};

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) return res.status(401).json({ message: 'No token provided' });

  const token = authHeader.split(' ')[1];

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Invalid token' });

    req.user = decoded;
    next();
  });
};

module.exports = { generateToken, comparePassword, verifyToken };
