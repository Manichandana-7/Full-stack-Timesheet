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
                  ),
                  project_manager (project_id, manager_id)
              )
          `)
      .eq('manager_id', managerId);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Create a map to track unique timesheets by employee and week_start_date
    const uniqueTimesheets = new Map();

    data.forEach(entry => {
      const timesheet = entry.timesheets; 
      const employeeId = timesheet.employee_id;
      const weekStartDate = timesheet.week_start_date;
      const key = `${employeeId}-${weekStartDate}`;
      if (!uniqueTimesheets.has(key)) {
        uniqueTimesheets.set(key, timesheet);
      }
    });

    const filteredData = Array.from(uniqueTimesheets.values());
    return res.status(200).json(filteredData);
  } catch (err) {
    console.error("Error fetching timesheets:", err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get("/performance-reviews/all/:managerId", async (req, res) => {
  const { managerId } = req.params;

  try {
    const { data, error } = await supabase
      .from("performance_reviews")
      .select("*")
      .eq("project_manager_id", managerId);

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ error: "Error fetching performance reviews" });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error("Server error:", err.message);
    return res.status(500).json({ error: "Server error" });
  }
});


router.post('/performance-reviews', async (req, res) => {
  const { timesheet_id, project_manager_id, rating, feedback, status } = req.body;

  console.log('Received data:', req.body);  

  try {
    
    if (!timesheet_id || !project_manager_id || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data: existingReviews, error: existingReviewsError } = await supabase
      .from('performance_reviews')
      .select('*')
      .eq('timesheet_id', timesheet_id)
      .eq('project_manager_id', project_manager_id);

    if (existingReviewsError) {
      return res.status(400).json({ error: existingReviewsError.message });
    }

    
    if (status === 'Approved' && (rating === undefined || rating === null)) {
      return res.status(400).json({ error: 'Missing rating for approved timesheet' });
    }

    const { data: reviewData, error: reviewError } = await supabase
      .from('performance_reviews') 
      .insert([
        {
          timesheet_id,
          project_manager_id,
          rating,
          feedback: feedback || null, 
          status 
        },
      ]);

    if (reviewError) {
      return res.status(400).json({ error: reviewError.message });
    }

   
    const { error: updateTimesheetError } = await supabase
      .from('timesheets') 
      .update({ status })
      .eq('timesheet_id', timesheet_id);

    if (updateTimesheetError) {
      return res.status(400).json({ error: updateTimesheetError.message });
    }

    return res.status(201).json({ message: 'Performance review added successfully', review: reviewData });
  } catch (err) {
    console.error("Error submitting performance review:", err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.get('/performance-reviews/:timesheet_id', async (req, res) => {
  const { timesheet_id } = req.params;

  try {
    
    const { data, error } = await supabase
      .from('performance_reviews')
      .select('*')
      .eq('timesheet_id', timesheet_id)
      .single(); 
    console.log('Data from Supabase:', data);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    
    if (data) {
      return res.status(200).json({ rating: data.rating });
    } else {
      return res.status(200).json({ rating: null }); 
    }
  } catch (err) {
    console.error("Error fetching performance review:", err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.get('/:timesheetId/:managerId', async (req, res) => {
  const { timesheetId, managerId } = req.params;

  try {
  
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('project_id')
      .eq('project_manager_id', managerId); 

    if (projectsError) {
      return res.status(400).json({ error: projectsError.message });
    }

    const projectIds = projects.map(project => project.project_id);
    const { data, error } = await supabase
      .from('entries')
      .select(`
          entry_id,
          project_id,
          task_id,
          week_start_date,
          comments,
          mon_hours,
          tue_hours,
          wed_hours,
          thu_hours,
          fri_hours,
          sat_hours,
          sun_hours,
          projects:projects(project_name),
          tasks:tasks(task_name)
        `)
      .eq('timesheet_id', timesheetId) 
      .in('project_id', projectIds); 

    if (error) {
      return res.status(400).json({ error: error.message });
    }
    return res.json(data);

  } catch (err) {
    console.error('Error fetching timesheet entries:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});



module.exports = router;