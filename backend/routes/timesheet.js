// const express = require('express');
// const router = express.Router();
// const { verifyToken } = require('../utils/auth');

// router.get('/protected-data', verifyToken, (req, res) => {
//   res.json({ message: `Hello, ${req.user.email}. You have access!`, role: req.user.role });
// });

// module.exports = router;


const express = require('express');
const router = express.Router();
const { supabase } = require('../config/db'); 

router.get('/projects/:employee_id', async (req, res) => {
  const { employee_id } = req.params;

  try {
    const { data, error } = await supabase
      .from('project_team')
      .select('project_id, projects(project_name, project_manager_id)')
      .eq('employee_id', employee_id);

    if (error) {
      console.error('Supabase error:', error.message);
      return res.status(500).json({ error: 'Internal server error' });
    }

    const projects = data.map(p => ({
      project_id: p.project_id,
      ...p.projects,
    }));

    res.status(200).json(projects);
  } catch (err) {
    console.error(' Unexpected error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Fetch tasks based on project_id
// GET /api/tasks/:projectId
router.get('/tasks/:project_id', async (req, res) => {
    const { project_id } = req.params;
  
    try {
      const { data, error } = await supabase
        .from('project_tasks')
        .select('task_id, tasks(task_name)')
        .eq('project_id', project_id);
  
      if (error) {
        console.error(' Supabase error:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
      }
  
      const tasks = data.map(entry => ({
        task_id: entry.task_id,
        task_name: entry.tasks.task_name
      }));
  
      res.status(200).json(tasks);
    } catch (err) {
      console.error(' Unexpected error:', err.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

// Create a new time entry
router.post('/entries', async (req, res) => {
  const {
    timesheet_id,
    project_id,
    task_id,
    week_start_date,
    mon_hours = 0,
    tue_hours = 0,
    wed_hours = 0,
    thu_hours = 0,
    fri_hours = 0,
    sat_hours = 0,
    sun_hours = 0,
    comments = ''
  } = req.body;

  try {
    const { data, error } = await supabase
      .from('entries')
      .insert([
        {
          timesheet_id,
          project_id,
          task_id,
          week_start_date,
          mon_hours,
          tue_hours,
          wed_hours,
          thu_hours,
          fri_hours,
          sat_hours,
          sun_hours,
          comments
        }
      ])
      .select(); // to return the inserted row

    if (error) {
      console.error('Supabase error:', error.message);
      return res.status(500).json({ error: 'Failed to create time entry' });
    }

    res.status(201).json({ message: 'Entry created successfully', entry: data[0] });
  } catch (err) {
    console.error('Unexpected error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/timesheets', async (req, res) => {
    const {
      employee_id,
      week_start_date,
      week_end_date,
      status, // "Saved" or "Submitted"
      entries
    } = req.body;
  
    try {
      // 1. Calculate total hours
      const total_hours = entries.reduce((total, entry) => {
        return total + (entry.mon_hours || 0) + (entry.tue_hours || 0) +
          (entry.wed_hours || 0) + (entry.thu_hours || 0) +
          (entry.fri_hours || 0) + (entry.sat_hours || 0) +
          (entry.sun_hours || 0);
      }, 0);
  
      // 2. Check for existing timesheet
      const { data: existingTimesheets, error: checkError } = await supabase
        .from('timesheets')
        .select('*')
        .eq('employee_id', employee_id)
        .eq('week_start_date', week_start_date)
        .limit(1);
  
      if (checkError) throw checkError;
  
      let timesheet_id;
  
      if (existingTimesheets.length > 0) {
        // Timesheet exists — update it
        const existing = existingTimesheets[0];
        timesheet_id = existing.timesheet_id;
  
        // Update total_hours and update status if going from "Saved" to "Submitted"
        const updatedStatus = (existing.status === "Saved" && status === "Submitted") ? "Submitted" : existing.status;
  
        const { error: timesheetUpdateError } = await supabase
          .from('timesheets')
          .update({ status: updatedStatus, total_hours })
          .eq('timesheet_id', timesheet_id);
  
        if (timesheetUpdateError) throw timesheetUpdateError;
      } else {
        // Insert new timesheet
        const { data: newTimesheet, error: insertError } = await supabase
          .from('timesheets')
          .insert([
            { employee_id, week_start_date, week_end_date, status, total_hours }
          ])
          .select();
  
        if (insertError) throw insertError;
        timesheet_id = newTimesheet[0].timesheet_id;
      }
  
      // 3. Fetch existing entries for this timesheet
      const { data: existingEntries, error: entryFetchError } = await supabase
        .from('entries')
        .select('*')
        .eq('timesheet_id', timesheet_id);
  
      if (entryFetchError) throw entryFetchError;
  
      const updates = [];
      const inserts = [];
  
      for (const entry of entries) {
        const existing = existingEntries.find(e =>
          e.project_id === entry.project_id && e.task_id === entry.task_id
        );
  
        const entryData = {
          timesheet_id,
          project_id: entry.project_id,
          task_id: entry.task_id,
          mon_hours: entry.mon_hours || 0,
          tue_hours: entry.tue_hours || 0,
          wed_hours: entry.wed_hours || 0,
          thu_hours: entry.thu_hours || 0,
          fri_hours: entry.fri_hours || 0,
          sat_hours: entry.sat_hours || 0,
          sun_hours: entry.sun_hours || 0,
          comments: entry.comments || '',
          week_start_date
        };
  
        if (existing) {
          const changed = (
            existing.mon_hours !== entryData.mon_hours ||
            existing.tue_hours !== entryData.tue_hours ||
            existing.wed_hours !== entryData.wed_hours ||
            existing.thu_hours !== entryData.thu_hours ||
            existing.fri_hours !== entryData.fri_hours ||
            existing.sat_hours !== entryData.sat_hours ||
            existing.sun_hours !== entryData.sun_hours ||
            existing.comments !== entryData.comments
          );
  
          if (changed) {
            updates.push(entryData);
          }
        } else {
          inserts.push(entryData);
        }
      }
  
      // 4. Apply updates using composite key
      for (const update of updates) {
        const { project_id, task_id, ...fields } = update;
  
        const { error: updateError } = await supabase
          .from('entries')
          .update(fields)
          .eq('timesheet_id', timesheet_id)
          .eq('project_id', project_id)
          .eq('task_id', task_id);
  
        if (updateError) {
          console.error(`Error updating entry for project ${project_id} and task ${task_id}`, updateError);
          throw updateError;
        }
      }
  
      // 5. Insert new entries
      if (inserts.length > 0) {
        const { error: insertEntryError } = await supabase
          .from('entries')
          .insert(inserts);
        if (insertEntryError) throw insertEntryError;
      }
  
      res.status(200).json({
        message: existingTimesheets.length > 0 ? 'Timesheet updated successfully' : 'Timesheet created successfully',
        timesheet_id
      });
  
    } catch (err) {
      console.error("🔥 Backend Error:", err.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

// DELETE /timesheet/entries
router.delete('/entries', async (req, res) => {
    try {
      const { employee_id, project_id, task_id, week_start_date } = req.query;
  
      console.log("🧾 DELETE /entries query params:", req.query);
  
      // Validate input
      if (!employee_id || !project_id || !task_id || !week_start_date) {
        return res.status(400).json({ message: 'Missing one or more required query parameters' });
      }
  
      // 1. Fetch the timesheet_id based on employee_id and week_start_date from the timesheet table
      const { data: timesheets, error: timesheetError } = await supabase
        .from('timesheets')
        .select('timesheet_id')
        .eq('employee_id', employee_id)  // Query by employee_id
        .eq('week_start_date', week_start_date)  // Query by week_start_date
        .single();  // Assuming there is only one matching record
  
      if (timesheetError || !timesheets) {
        console.error("❌ Error fetching timesheet:", timesheetError);
        return res.status(404).json({ message: 'Timesheet not found' });
      }
  
      const timesheetId = timesheets.timesheet_id; // Get timesheet_id
  
      // 2. Delete the entry from the entries table using timesheet_id
      const { data, error } = await supabase
        .from('entries')
        .delete()
        .eq('timesheet_id', timesheetId)  // Using the timesheet_id from the previous step
        .eq('project_id', project_id)
        .eq('task_id', task_id)
        .eq('week_start_date', week_start_date);
  
      if (error) {
        console.error("❌ Supabase delete error:", error);
        return res.status(500).json({ message: 'Failed to delete entry', error });
      }
  
      console.log("✅ Entry deleted:", data);
      res.status(200).json({ message: 'Entry deleted successfully' });
  
    } catch (err) {
      console.error("🔥 Unexpected error in DELETE /entries:", err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });
  
module.exports = router;
