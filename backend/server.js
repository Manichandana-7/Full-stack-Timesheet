const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const timesheetRoutes = require('./routes/timesheet');
const savedsheets = require('./routes/savedsheets'); // if any

app.use(cors());
app.use(express.json()); // to parse JSON body

app.use('/api/auth', authRoutes); // Login route
app.use('/api/timesheet', timesheetRoutes); // Protected routes
app.use('/api/savedsheets', savedsheets); // Saved timesheet route


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
