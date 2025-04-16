const express = require('express');
const router = express.Router();
const { supabase } = require('../config/db'); 
const authenticateToken = require('../middleware/authMiddleware');
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

      // Iterate over the data to filter unique timesheets
      data.forEach(entry => {
          const timesheet = entry.timesheets; // Access the timesheets object
          const employeeId = timesheet.employee_id;
          const weekStartDate = timesheet.week_start_date;

          // Create a unique key for each employee and week_start_date
          const key = `${employeeId}-${weekStartDate}`;

          // Check if the key already exists in the map
          if (!uniqueTimesheets.has(key)) {
              uniqueTimesheets.set(key, timesheet);
          }
      });

      // Convert the map back to an array
      const filteredData = Array.from(uniqueTimesheets.values());

      return res.status(200).json(filteredData);
  } catch (err) {
      console.error("Error fetching timesheets:", err);
      return res.status(500).json({ error: 'Internal Server Error' });
  }
});

  // router.get('/:managerId', async (req, res) => {
  //   const { managerId } = req.params;
   
  //   try {
  //     // Step 1: Get all project IDs for the manager
  //     const { data: projects, error: projectError } = await supabase
  //       .from('project_manager')
  //       .select('project_id')
  //       .eq('manager_id', managerId);
   
  //     if (projectError) {
  //       return res.status(400).json({ error: projectError.message });
  //     }
   
  //     const projectIds = projects.map(p => p.project_id);
   
  //     // Step 2: Fetch timesheets for those projects
  //     const { data: timesheets, error: timesheetError } = await supabase
  //     .from('project_manager')
  //     .select(`
  //       timesheets (
  //         timesheet_id,
  //         employee_id,
  //         week_start_date,
  //         week_end_date,
  //         status,
  //         total_hours,
  //         employees (
  //           name
  //         ),
  //         project_manager (project_id,manager_id)
  //       )
  //     `)
  //     .eq('manager_id', managerId);
   
  //     if (timesheetError) {
  //       return res.status(400).json({ error: timesheetError.message });
  //     }
   
  //     // Step 3: Filter to unique employee-week pairs
  //     const uniqueMap = new Map();
   
  //     timesheets.forEach(ts => {
  //       const key = `${ts.employee_id}-${ts.week_start_date}`;
  //       if (!uniqueMap.has(key)) {
  //         uniqueMap.set(key, ts);
  //       }
  //     });
   
  //     const uniqueTimesheets = Array.from(uniqueMap.values());
   
  //     return res.status(200).json(uniqueTimesheets);
  //   } catch (err) {
  //     console.error("Error fetching timesheets:", err);
  //     return res.status(500).json({ error: 'Internal Server Error' });
  //   }
  // });
   

  // router.get('/:managerId', async (req, res) => {
  //   const { managerId } = req.params;
  
  //   try {
  //     // First get all projects managed by this manager
  //     const { data: projects, error: projectsError } = await supabase
  //       .from('project_manager')
  //       .select('project_id')
  //       .eq('manager_id', managerId);
  
  //     if (projectsError) {
  //       return res.status(400).json({ error: projectsError.message });
  //     }
  
  //     const projectIds = projects.map(p => p.project_id);
  
  //     // Then get timesheets for these projects
  //     const { data: timesheets, error: timesheetsError } = await supabase
  //       .from('timesheets')
  //       .select(`
  //         timesheet_id,
  //         employee_id,
  //         week_start_date,
  //         week_end_date,
  //         status,
  //         total_hours,
  //         employees(name),
  //         projects:project_manager!inner(project_id, manager_id)
  //       `)
  //       .in('projects.project_id', projectIds)
  //       .eq('projects.manager_id', managerId);
  
  //     if (timesheetsError) {
  //       return res.status(400).json({ error: timesheetsError.message });
  //     }
  
  //     // Remove duplicates by using a Set
  //     const uniqueTimesheets = [];
  //     const seenTimesheets = new Set();
  
  //     timesheets.forEach(ts => {
  //       if (!seenTimesheets.has(ts.timesheet_id)) {
  //         seenTimesheets.add(ts.timesheet_id);
  //         uniqueTimesheets.push({
  //           ...ts,
  //           employee_name: ts.employees?.name,
  //           employees: undefined // Remove nested object
  //         });
  //       }
  //     });
  
  //     return res.status(200).json(uniqueTimesheets);
  //   } catch (err) {
  //     console.error("Error fetching timesheets:", err);
  //     return res.status(500).json({ error: 'Internal Server Error' });
  //   }
  // });
  router.get('/:managerId', async (req, res) => {
    const { managerId } = req.params;
    
    try {
      // Step 1: Get all timesheets for projects managed by this manager
      const { data: timesheets, error: timesheetError } = await supabase
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
  
      if (timesheetError) {
        return res.status(400).json({ error: timesheetError.message });
      }
  
      // Step 2: Flatten the nested structure
      const allTimesheets = timesheets.flatMap(pm => 
        pm.timesheets.map(ts => ({
          ...ts,
          project_id: pm.project_id, // Include project_id if needed
          employee_name: ts.employees?.name
        }))
      );
  
      // Remove the nested employees object if you want cleaner output
      const cleanedTimesheets = allTimesheets.map(({ employees, ...rest }) => rest);
  
      return res.status(200).json(cleanedTimesheets);
    } catch (err) {
      console.error("Error fetching timesheets:", err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  router.post('/performance-reviews', async (req, res) => {
    const { timesheet_id, project_manager_id, rating, feedback, status } = req.body;
    
    console.log('Received data:', req.body);  // Log the received request data
  
    try {
      // Validate input
      if (!timesheet_id || !project_manager_id || !status) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
  
      // Check if a review already exists for this timesheet_id and project_manager_id
      const { data: existingReviews, error: existingReviewsError } = await supabase
        .from('performance_reviews')
        .select('*')
        .eq('timesheet_id', timesheet_id)
        .eq('project_manager_id', project_manager_id);
  
      if (existingReviewsError) {
        return res.status(400).json({ error: existingReviewsError.message });
      }
  
      // Insert the performance review as a new row
      // Check if the rating is required for approval
      if (status === 'Approved' && (rating === undefined || rating === null)) {
        return res.status(400).json({ error: 'Missing rating for approved timesheet' });
      }

      // Insert the performance review into the database as a new row
      const { data: reviewData, error: reviewError } = await supabase
        .from('performance_reviews') // Replace with your actual table name
        .insert([
          {
            timesheet_id,
            project_manager_id,
            rating,
            feedback: feedback || null, // Allow feedback to be null
            status // Set the status based on the rating
          },
        ]);

      if (reviewError) {
        return res.status(400).json({ error: reviewError.message });
      }

      // Optionally, update the status of the timesheet if needed (if relevant to your use case)
      const { error: updateTimesheetError } = await supabase
        .from('timesheets') // Replace with your actual timesheet table name
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
      // Query the performance_reviews table for the given timesheet_id
      const { data, error } = await supabase
        .from('performance_reviews') // Replace with your actual table name
        .select('*')
        .eq('timesheet_id', timesheet_id)
        .single(); // Use .single() to get a single record
        console.log('Data from Supabase:', data);
  
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


  router.get('/:timesheetId/:managerId', async (req, res) => {
    const { timesheetId, managerId } = req.params;
  
    try {
      // Fetch projects for the given project manager
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('project_id')
        .eq('project_manager_id', managerId); // Get all projects managed by the manager
  
      if (projectsError) {
        return res.status(400).json({ error: projectsError.message });
      }
  
      const projectIds = projects.map(project => project.project_id);
  
      // Fetch entries for the given timesheet and filtered by project_ids
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
        .eq('timesheet_id', timesheetId) // Filter by timesheet_id
        .in('project_id', projectIds); // Filter by project_ids managed by the given managerId
  
      if (error) {
        return res.status(400).json({ error: error.message });
      }
  
      // Return the fetched entries
      return res.json(data);
  
    } catch (err) {
      console.error('Error fetching timesheet entries:', err);
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
  
  router.get('/:managerId', async (req, res) => {
    const { managerId } = req.params;
  
    try {
      // Step 1: Fetch all timesheets joined with project_manager
      const { data, error } = await supabase
        .from('timesheets')
        .select(`
          timesheet_id,
          employee_id,
          week_start_date,
          week_end_date,
          total_hours,
          status,
          employees(name),
          project_manager!inner(manager_id, project_id, projects(name))
        `)
        .eq('project_manager.manager_id', managerId)
        .in('status', ['Saved', 'Submitted']);
  
      if (error) {
        return res.status(400).json({ error: error.message });
      }
  
      // Step 2: Return as-is: one row per project per employee per week
      return res.json(data);
  
    } catch (err) {
      console.error('Error fetching manager timesheets:', err.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  
module.exports = router;