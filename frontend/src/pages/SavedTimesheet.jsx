// SavedTimesheet.jsx
import React, { useState, useEffect } from 'react';
import api from '../api/axios'; 

const SavedTimesheet = () => {
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTimesheets = async () => {
      try {
        // Retrieve employee_id from session storage
        const user = JSON.parse(localStorage.getItem("user"));
        const employeeId = user?.id;

        if (!employeeId) {
          setError('Employee ID not found in session storage');
          setLoading(false);
          return;
        }

        // Fetch saved timesheets from the backend
        const response = await api.get('/savedsheets/timesheets', {
          params: { employee_id: employeeId },
        });

        setTimesheets(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch timesheets');
        setLoading(false);
      }
    };

    fetchTimesheets();
  }, []);
  const handleEdit = (timesheetId) => {
  
  };

  return (
    <div>
      <h2>Saved Timesheets</h2>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {timesheets.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Total Hours</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {timesheets.map((timesheet) => (
              <tr key={timesheet.timesheet_id}>
                <td>{timesheet.week_start_date}</td>
                <td>{timesheet.week_end_date}</td>
                <td>{timesheet.total_hours}</td>
                <td>{timesheet.status}</td>
                <td>
                  <button onClick={() => handleEdit(timesheet.timesheet_id)}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No saved timesheets found.</p>
      )}
    </div>
  );

  // Function to handle the Edit button click
 
};

export default SavedTimesheet;
