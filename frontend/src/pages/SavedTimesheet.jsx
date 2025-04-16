import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Rating } from '@mui/material';
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

        const timesheetsData = response.data;

        const reviewResponse = await api.get('/savedsheets/reviews', {
          params: { employee_id: employeeId },
        });

        const timesheetsWithReviews = timesheetsData.map(sheet => {
          const reviews = reviewResponse.data.filter(r => r.timesheet_id === sheet.timesheet_id);
          return { ...sheet, reviews };
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

  const handleBackToList = () => {
    setIsEditing(false);
    setSelectedTimesheetId(null);
  };

  const handleSaveSuccess = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const employeeId = user?.id;

      if (!employeeId) {
        setError('Employee ID not found in session storage');
        return;
      }

      const response = await api.get('/savedsheets/timesheets', {
        params: { employee_id: employeeId },
      });

      setTimesheets(response.data);
      setIsEditing(false);
      setSelectedTimesheetId(null);
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
            <table className="min-w-full bg-white shadow-md  overflow-hidden " >
              <thead className="bg-[#1b0c5a] text-white p-2">
                <tr >
                  <th className="px-6 py-4 text-left text-sm font-semibold">Start Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">End Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Total Hours</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Project Managers</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Review Status</th>
                </tr>
              </thead>

              <tbody>
                {timesheets.map((timesheet, index) => (
                  <tr
                    key={timesheet.timesheet_id}
                    className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      } hover:bg-gray-100 transition duration-200 cursor-pointer` }
                  >
                    <td className="px-6 py-4 text-sm text-gray-800">{formatDate(timesheet.week_start_date)}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{formatDate(timesheet.week_end_date)}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{timesheet.total_hours}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {timesheet.reviews.length > 0 ? (
                        timesheet.reviews.map((review, idx) => (
                          <div key={idx}>{review.project_manager_name || 'N/A'}</div>
                        ))
                      ) : (
                        'No reviews'
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {timesheet.reviews.length > 0 ? (
                        timesheet.reviews.map((review, idx) => {
                          if (review.status === "Approved") {
                            return (
                              <div key={idx} className="text-green-600">
                                <p className="font-semibold">
                                  <Rating
                                    value={review.rating || 0} // Use review.rating, default to 0 if not available
                                    precision={1} // You can adjust this if you want half stars
                                    readOnly // Makes the rating uneditable
                                    // sx={{
                                    //   color: review.rating >= 3 ? '' : 'red', // Customize color based on rating
                                    // }}
                                  />
                                </p>
                                {review.rating < 3 && review.feedback && (
                                  <p className="text-sm"><strong>Feedback:</strong> {review.feedback}</p>
                                )}
                              </div>
                            );
                          } else if (review.status === "Rejected") {
                            return (
                              <div key={idx} className="text-red-600 font-semibold">
                                <p>{review.status}</p>
                              </div>
                            );
                          }
                          return null;
                        })
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-gray-300 text-gray-700 text-xs font-medium">
                          Pending
                        </span>
                      )}
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
          {/* <TimesheetCard 
            timesheetId={selectedTimesheetId}
            employeeId={JSON.parse(localStorage.getItem("user"))?.id}
            weekStartDate={timesheets.find(sheet => sheet.timesheet_id === selectedTimesheetId)?.week_start_date}
            onSaveSuccess={handleSaveSuccess} // Pass the callback to refresh data
          /> */}
        </div>
      )}
    </div>
  );
};

export default SavedTimesheet;