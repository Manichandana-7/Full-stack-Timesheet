const express = require('express');
const router = express.Router();
const { supabase } = require('../config/db');

router.get('/reviews', async (req, res) => {
  const { employee_id } = req.query;

  try {
    // Step 1: Fetch timesheets for the given employee_id to get the related timesheet_ids
    const { data: timesheets, error: timesheetsError } = await supabase
      .from('timesheets')
      .select('timesheet_id, employee_id')
      .eq('employee_id', employee_id);

    if (timesheetsError) throw new Error(timesheetsError.message);


    const timesheetIds = timesheets.map(timesheet => timesheet.timesheet_id);

    // Step 2: Fetch reviews based on timesheet_ids
    const { data: reviews, error: reviewsError } = await supabase
      .from('performance_reviews')
      .select('timesheet_id, status, rating, feedback, project_manager_id')
      .in('timesheet_id', timesheetIds);

    if (reviewsError) throw new Error(reviewsError.message);

    // Step 3: Fetch the project manager's name using project_manager_id from the reviews table
    const projectManagerIds = reviews.map(review => review.project_manager_id);
    const { data: projectManagers, error: projectManagersError } = await supabase
      .from('employees')
      .select('employee_id, name')
      .in('employee_id', projectManagerIds);

    if (projectManagersError) throw new Error(projectManagersError.message);

    // Step 4: Attach the project manager's name to each review
    const reviewsWithProjectManager = reviews.map(review => {
      const projectManager = projectManagers.find(manager => manager.employee_id === review.project_manager_id);
      return {
        ...review,
        project_manager_name: projectManager ? projectManager.name : 'N/A',
      };
    });


    res.json(reviewsWithProjectManager);
  } catch (err) {

    console.error('Failed to fetch reviews:', err);
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
});


router.get('/timesheets', async (req, res) => {
  try {
    const { employee_id } = req.query;

    if (!employee_id) {
      return res.status(400).json({ message: 'Employee ID is required' });
    }

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

router.get('/entries', async (req, res) => {
  try {
    const { timesheet_id } = req.query;
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .eq('timesheet_id', timesheet_id);

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;