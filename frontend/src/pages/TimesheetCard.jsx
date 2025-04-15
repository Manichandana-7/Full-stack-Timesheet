import React, { useState, useEffect } from 'react';
import api from '../api/axios'; // Assuming your API calls are defined in axios.js

const TimesheetCard = ({ timesheetId, weekStartDate, employeeId, onSaveSuccess }) => {
  const [timesheet, setTimesheet] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Fetch timesheet details based on timesheetId and employeeId
  useEffect(() => {
    if (!timesheetId || !employeeId || !weekStartDate) return;

    const fetchTimesheet = async () => {
      try {
        const response = await api.get('/timesheet/entries', {
          params: { employee_id: employeeId, week_start_date: weekStartDate }
        });

        // Assuming the response contains an array of entries
        setTimesheet(response.data);
      } catch (err) {
        setError('Error fetching timesheet details.');
      }
    };

    fetchTimesheet();
  }, [timesheetId, weekStartDate, employeeId]);

  // Handle form submission
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await api.put('/timesheet/submit', { // Example endpoint
        timesheetId,
        employeeId,
        weekStartDate,
        entries: timesheet.projects, // Assuming `projects` holds all timesheet entries
      });

      onSaveSuccess(); // Call the parent callback to indicate success
    } catch (err) {
      setError('Failed to submit timesheet');
    }
    setIsSubmitting(false);
  };

  // Handle changes in the input fields
  const handleChange = (projectId, taskId, day, value) => {
    setTimesheet(prevTimesheet => {
      const updatedProjects = prevTimesheet.projects.map(project => {
        if (project.project_id === projectId) {
          const updatedRows = project.rows.map(row => {
            if (row.task_id === taskId) {
              return {
                ...row,
                hours: {
                  ...row.hours,
                  [day]: value
                }
              };
            }
            return row;
          });
          return { ...project, rows: updatedRows };
        }
        return project;
      });
      return { ...prevTimesheet, projects: updatedProjects };
    });
  };

  // Format dates nicely
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (!timesheet) return <div>Loading...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div className="timesheet-card">
      <h3>Timesheet for Week Starting {formatDate(weekStartDate)}</h3>

      <form onSubmit={handleSubmit}>
        {timesheet.projects.map(project => (
          <div key={project.project_id} className="project">
            <h4>{project.project_name}</h4>
            {project.rows.map((row, rowIndex) => (
              <div key={rowIndex} className="task-row">
                <div className="task-info">
                  <label>Task ID: {row.task_id}</label>
                  <textarea
                    value={row.comments}
                    onChange={(e) => handleChange(project.project_id, row.task_id, 'comments', e.target.value)}
                    placeholder="Add comments..."
                  />
                </div>

                <div className="hours">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <div key={day} className="day">
                      <label>{day}</label>
                      <input
                        type="number"
                        value={row.hours[day] || ''}
                        onChange={(e) => handleChange(project.project_id, row.task_id, day, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}

        <div className="actions">
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Timesheet'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TimesheetCard;
