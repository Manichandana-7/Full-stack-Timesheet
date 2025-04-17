const express = require('express');
const router = express.Router();
const { supabase } = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const { data: employee, error } = await supabase
      .from('employees')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !employee) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      {
        id: employee.employee_id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.cookie('token', token, {
      httpOnly: false,  // Ensures cookie is not accessible via JavaScript
      secure: process.env.NODE_ENV === 'production',  // Ensures it's only sent over HTTPS in production
      sameSite: 'Lax', 
      maxAge: 2 * 60 * 60 * 1000,  // 2 hours in ms
    });

    res.json({
      token,
      employee: {
        id: employee.employee_id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
