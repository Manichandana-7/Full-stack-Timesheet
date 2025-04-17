const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const timesheetRoutes = require('./routes/timesheet');
const savedsheets = require('./routes/savedsheets'); 
const approvalRoutes = require('./routes/approval'); 


app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true
}));
app.use(express.json()); 

app.use('/api/auth', authRoutes); 
app.use('/api/timesheet', timesheetRoutes); 
app.use('/api/savedsheets', savedsheets); 
app.use('/api/approval', approvalRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
