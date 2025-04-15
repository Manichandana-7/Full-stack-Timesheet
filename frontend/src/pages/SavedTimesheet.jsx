import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios'; 
import TimesheetCard from './TimesheetCard';

const SavedTimesheet = () => {
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimesheetId, setSelectedTimesheetId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTimesheets = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const employeeId = user?.id;

        if (!employeeId) {
          setError('Employee ID not found in session storage');
          setLoading(false);
          return;
        }

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

  const handleEdit = async (timesheetId, status) => {
    if (status === "Submitted" || status === "approved") {
      alert("This timesheet has already been submitted and cannot be edited.");
      return;
    }

    try {
      // Set the selected timesheet ID and switch to edit mode
      setSelectedTimesheetId(timesheetId);
      setIsEditing(true);
      
      // Alternatively, navigate to a separate edit page:
      // navigate(`/edit-timesheet/${timesheetId}`);
    } catch (err) {
      setError('Failed to fetch timesheet details');
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleBackToList = () => {
    setIsEditing(false);
    setSelectedTimesheetId(null);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div className="timesheet-container">
      {!isEditing ? (
        <>
          <h2>Saved Timesheets</h2>
          
          {timesheets.length > 0 ? (
            <table className="timesheet-table">
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
                    <td>{formatDate(timesheet.week_start_date)}</td>
                    <td>{formatDate(timesheet.week_end_date)}</td>
                    <td>{timesheet.total_hours}</td>
                    <td>
                      <span className={`status-badge ${timesheet.status.toLowerCase()}`}>
                        {timesheet.status}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleEdit(timesheet.timesheet_id, timesheet.status)}
                        disabled={timesheet.status === "Submitted" || timesheet.status === "approved"}
                        className={`edit-btn ${timesheet.status === "Submitted" || timesheet.status === "approved" ? 'disabled' : ''}`}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No saved timesheets found.</p>
          )}
        </>
      ) : (
        <div className="edit-container">
          <button onClick={handleBackToList} className="back-btn">
            ← Back to Timesheets
          </button>
          <TimesheetCard 
            timesheetId={selectedTimesheetId}
            onSaveSuccess={() => {
              setIsEditing(false);
              // Optionally refresh the timesheets list
              fetchTimesheets();
            }}
          />
        </div>
      )}
    </div>
  );
};

export default SavedTimesheet;