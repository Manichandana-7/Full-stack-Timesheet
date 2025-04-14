const express = require('express');
const router = express.Router();
const { supabase } = require('../config/db'); 
// Backend Route: Fetch Saved Timesheets for Employee
router.get('/timesheets', async (req, res) => {
    try {
      const { employee_id } = req.query;
  
      if (!employee_id) {
        return res.status(400).json({ message: 'Employee ID is required' });
      }
  
      // Fetch timesheets from the database based on employee_id
      const { data, error } = await supabase
        .from('timesheets')
        .select('timesheet_id, week_start_date, week_end_date, total_hours, status')
        .eq('employee_id', employee_id);
  
      if (error) {
        console.error('Error fetching timesheets:', error);
        return res.status(500).json({ message: 'Failed to fetch timesheets', error });
      }
  
      return res.status(200).json(data);
    } catch (err) {
      console.error('Unexpected error:', err);
      return res.status(500).json({ message: 'Server error', error: err.message });
    }
  });
  

// router.get('/timesheets', async (req, res) => {
//     try {
//       // Query the database to fetch the timesheets
//       const { data, error } = await supabase
//         .from('timesheets')
//         .select('timesheet_id,employee_id, status, total_hours') // Adjust columns as needed
  
//       if (error) {
//         return res.status(500).json({ message: 'Error fetching timesheets', error });
//       }
  
//       res.status(200).json(data);
//     } catch (err) {
//       console.error('Error fetching timesheets:', err);
//       res.status(500).json({ message: 'Server error', error: err.message });
//     }
//   });

//   // Backend Route to fetch a full timesheet
// router.get('/timesheet/:id', async (req, res) => {
//     try {
//       const { id } = req.params;
  
//       const { data, error } = await supabase
//         .from('timesheet')
//         .select('*')
//         .eq('timesheet_id', id)
//         .single(); // Fetch the full timesheet
  
//       if (error) {
//         return res.status(500).json({ message: 'Error fetching timesheet', error });
//       }
  
//       // Fetch projects and entries associated with the timesheet
//       const { data: projects, error: projectError } = await supabase
//         .from('projects')
//         .select('*')
//         .eq('timesheet_id', id);
  
//       if (projectError) {
//         return res.status(500).json({ message: 'Error fetching projects', error: projectError });
//       }
  
//       // Include the projects data in the response
//       res.status(200).json({ ...data, projects });
//     } catch (err) {
//       console.error('Error fetching timesheet:', err);
//       res.status(500).json({ message: 'Server error', error: err.message });
//     }
//   });
  
//   // Backend Route to update timesheet
//   router.put('/timesheet/:id', async (req, res) => {
//     try {
//       const { id } = req.params;
//       const { total_hours, status, projects } = req.body;
  
//       // Update the timesheet with the new values
//       const { data, error } = await supabase
//         .from('timesheet')
//         .update({ total_hours, status })
//         .eq('timesheet_id', id);
  
//       if (error) {
//         return res.status(500).json({ message: 'Error updating timesheet', error });
//       }
  
//       // Update the projects and their entries if needed
//       // (Assuming you need to update each project's entries as well)
  
//       for (let project of projects) {
//         for (let entry of project.entries) {
//           const { data: entryData, error: entryError } = await supabase
//             .from('entries')
//             .upsert(entry) // Assuming you are updating/creating entries
//             .eq('entry_id', entry.entry_id);
  
//           if (entryError) {
//             console.error('Error updating entry:', entryError);
//           }
//         }
//       }
  
//       res.status(200).json({ message: 'Timesheet updated successfully', data });
//     } catch (err) {
//       console.error('Error updating timesheet:', err);
//       res.status(500).json({ message: 'Server error', error: err.message });
//     }
//   });
  
module.exports = router;