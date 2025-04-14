const express = require('express');
const router = express.Router();
const { supabase } = require('../config/db');
const { generateToken, comparePassword } = require('../utils/auth');

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const { data: employee, error } = await supabase
    .from('employees')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !employee) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const isMatch = await comparePassword(password, employee.password);

  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const token = generateToken(employee);
  res.json({ token, employee: {id:employee.employee_id, name: employee.name, email: employee.email, role: employee.role } });
});

module.exports = router;
