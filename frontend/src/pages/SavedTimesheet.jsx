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

  // Fetch saved timesheets and reviews data from the backend
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

        // Fetch timesheets data
        const response = await api.get('/savedsheets/timesheets', {
          params: { employee_id: employeeId },
        });

        const timesheetsData = response.data;

        // Fetch project manager and review status for each timesheet
        const reviewResponse = await api.get('/savedsheets/reviews', {
          params: { employee_id: employeeId },
        });

        // Merge review data with timesheets
        const timesheetsWithReviews = timesheetsData.map(sheet => {
          const review = reviewResponse.data.find(r => r.timesheet_id === sheet.timesheet_id);
          return { ...sheet, review };
        });

        setTimesheets(timesheetsWithReviews);
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

    setSelectedTimesheetId(timesheetId);
    setIsEditing(true);
  };

  const handleBackToList = () => {
    setIsEditing(false);
    setSelectedTimesheetId(null);
  };

  // Refresh timesheets after successful save
  const handleSaveSuccess = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const employeeId = user?.id;

      if (!employeeId) {
        setError('Employee ID not found in session storage');
        return;
      }

      // Re-fetch the timesheets after saving
      const response = await api.get('/savedsheets/timesheets', {
        params: { employee_id: employeeId },
      });

      setTimesheets(response.data); // Update the state with new timesheets
      setIsEditing(false); // Switch back to list view
      setSelectedTimesheetId(null); // Reset selected timesheet
    } catch (err) {
      setError('Failed to fetch updated timesheets');
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) return <div className="text-center text-xl">Loading...</div>;
  if (error) return <div className="text-center text-xl text-red-600">{error}</div>;

  return (
    <div className="container mx-auto p-6">
      {!isEditing ? (
        <>
          <h2 className="text-3xl font-semibold mb-6">Saved Timesheets</h2>
          
          {timesheets.length > 0 ? (
            <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Start Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">End Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Total Hours</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Project Manager</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Review Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {timesheets.map((timesheet) => (
                  <tr key={timesheet.timesheet_id} className="border-b">
                    <td className="px-6 py-4 text-sm text-gray-800">{formatDate(timesheet.week_start_date)}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{formatDate(timesheet.week_end_date)}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{timesheet.total_hours}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{timesheet.review?.project_manager_name || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full ${timesheet.review?.status === 'approved' ? 'bg-green-300' : 'bg-yellow-300'} text-gray-700`}>
                        {timesheet.review?.status || 'Pending'}
                      </span>
                      {timesheet.review?.status === 'approved' && (
                        <div className="mt-2 text-sm">
                          <p><strong>Rating:</strong> {timesheet.review?.rating || 'N/A'}</p>
                          <p><strong>Feedback:</strong> {timesheet.review?.feedback || 'No feedback provided'}</p>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => handleEdit(timesheet.timesheet_id, timesheet.review?.status)}
                        disabled={timesheet.review?.status === "approved" || timesheet.review?.status === "Rejected"}
                        className={`px-4 py-2 bg-blue-500 text-white rounded-lg shadow-sm hover:bg-blue-600 focus:outline-none disabled:bg-gray-400`}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="mt-4 text-center text-lg text-gray-600">No saved timesheets found.</p>
          )}
        </>
      ) : (
        <div className="bg-white p-6 shadow-md rounded-lg">
          <button
            onClick={handleBackToList}
            className="px-4 py-2 text-white bg-gray-500 rounded-lg hover:bg-gray-600 focus:outline-none mb-4"
          >
            ← Back to Timesheets
          </button>
          <TimesheetCard 
            timesheetId={selectedTimesheetId}
            employeeId={JSON.parse(localStorage.getItem("user"))?.id}
            weekStartDate={timesheets.find(sheet => sheet.timesheet_id === selectedTimesheetId)?.week_start_date}
            onSaveSuccess={handleSaveSuccess} // Pass the callback to refresh data
          />
        </div>
      )}
    </div>
  );
};

export default SavedTimesheet;
