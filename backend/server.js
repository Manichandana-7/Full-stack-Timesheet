const express = require('express');
const app = express();
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const timesheetRoutes = require('./routes/timesheet');
const savedsheets = require('./routes/savedsheets'); // if any
const approvalRoutes = require('./routes/approval'); // Approval route
const authMiddleware = require('./middleware/authMiddleware');

app.use(cors({
  origin: 'http://localhost:5173', // frontend origin
  credentials: true
}));
app.use(express.json()); // to parse JSON body

app.use('/api/auth', authRoutes); // Login route
app.use('/api/timesheet', timesheetRoutes); // Protected routes
app.use('/api/savedsheets', savedsheets); // Saved timesheet route
app.use('/api/approval', approvalRoutes); // Approval route


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
