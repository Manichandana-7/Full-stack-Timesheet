const express = require('express');
const router = express.Router();
const { supabase } = require('../config/db'); 
router.get('/:managerId', async (req, res) => {
    const { managerId } = req.params;
  
    try {
      const { data, error } = await supabase
        .from('project_manager')
        .select(`
          timesheets (
            timesheet_id,
            employee_id,
            week_start_date,
            week_end_date,
            status,
            total_hours,
            employees (
              name
            )
          )
        `)
        .eq('manager_id', managerId);
  
      if (error) {
        return res.status(400).json({ error: error.message });
      }
  
      return res.status(200).json(data);
    } catch (err) {
      console.error("Error fetching timesheets:", err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }); 

  router.post('/performance-reviews', async (req, res) => {
    const { timesheet_id, project_manager_id, rating, feedback } = req.body;
  
    try {
      // Validate input
      if (!timesheet_id || !project_manager_id || !rating) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
  
      // Determine the new status based on the rating
      const newStatus = rating >= 3 ? 'approved' : 'rejected';
  
      // Insert the performance review into the database
      const { data: reviewData, error: reviewError } = await supabase
        .from('performance_reviews') // Replace with your actual table name
        .insert([
          {
            timesheet_id,
            project_manager_id,
            rating,
            feedback: feedback || null, // Allow feedback to be null
          },
        ]);
  
      if (reviewError) {
        return res.status(400).json({ error: reviewError.message });
      }
  
      // Update the status of the timesheet
      const { error: updateError } = await supabase
        .from('timesheets') // Replace with your actual timesheet table name
        .update({ status: newStatus })
        .eq('timesheet_id', timesheet_id);
  
      if (updateError) {
        return res.status(400).json({ error: updateError.message });
      }
  
      return res.status(201).json({ message: 'Performance review submitted successfully', review: reviewData });
    } catch (err) {
      console.error("Error submitting performance review:", err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  router.get('/performance-reviews/:timesheet_id', async (req, res) => {
    const { timesheet_id } = req.params;
  
    try {
      // Query the performance_reviews table for the given timesheet_id
      const { data, error } = await supabase
        .from('performance_reviews') // Replace with your actual table name
        .select('rating')
        .eq('timesheet_id', timesheet_id)
        .single(); // Use .single() to get a single record
  
      if (error) {
        return res.status(400).json({ error: error.message });
      }
  
      // If a review exists, return the rating; otherwise, return null
      if (data) {
        return res.status(200).json({ rating: data.rating });
      } else {
        return res.status(200).json({ rating: null }); // No review found
      }
    } catch (err) {
      console.error("Error fetching performance review:", err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  });
module.exports = router;