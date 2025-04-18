import React, { useState, useEffect } from "react";
import api from "../api/axios";
import { Rating } from "@mui/material";
import { jwtDecode } from 'jwt-decode';

const getUserFromCookie = () => {
  console.log('cookie', document.cookie);
  const cookie = document.cookie
    .split('; ')
    .find(row => row.startsWith('token='));

  if (!cookie) return null;

  const token = cookie.split('=')[1];

  try {
    const decoded = jwtDecode(token); // { id, name, email, role }
    return decoded;
  } catch (error) {
    console.error('Invalid token:', error);
    return null;
  }
};
const SavedTimesheet = () => {
  const [timesheets, setTimesheets] = useState([]);

  const [selectedManagers, setSelectedManagers] = useState({});


  useEffect(() => {
    const fetchTimesheets = async () => {
      try {
        const user = getUserFromCookie();
        const employeeId = user?.id;

        if (!employeeId) {
          setError("Employee ID not found in cookie storage");
          setLoading(false);
          return;
        }

        const response = await api.get("/savedsheets/timesheets", {
          params: { employee_id: employeeId },
        });

        const timesheetsData = response.data;

        const reviewResponse = await api.get("/savedsheets/reviews", {
          params: { employee_id: employeeId },
        });

        const timesheetsWithReviews = timesheetsData.map((sheet) => {
          const reviews = reviewResponse.data.filter(
            (r) => r.timesheet_id === sheet.timesheet_id
          );
          return { ...sheet, reviews };
        });

        setTimesheets(timesheetsWithReviews);

      } catch (err) {
        setError("Failed to fetch timesheets");
      }
    };

    fetchTimesheets();
  }, []);



  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };


  return (
    <div className="container mx-auto px-4 sm:px-6 py-6">
      <h2 className="text-2xl sm:text-3xl font-semibold mb-6 text-center sm:text-left">Saved Timesheets</h2>
  
      {timesheets.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto bg-white shadow-md rounded-md">
            <thead className="bg-[#1b0c5a] text-white text-sm sm:text-md">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left font-semibold w-[120px] sm:w-[150px]">
                  Start Date
                </th>
                <th className="px-4 sm:px-6 py-3 text-left font-semibold w-[120px] sm:w-[150px]">
                  End Date
                </th>
                <th className="px-4 sm:px-6 py-3 text-left font-semibold w-[100px] sm:w-[130px]">
                  Total Hours
                </th>
                <th className="px-4 sm:px-6 py-3 text-left font-semibold w-[180px] sm:w-[200px]">
                  Project Managers
                </th>
                <th className="px-4 sm:px-6 py-3 text-left font-semibold w-[220px] sm:w-[250px]">
                  Review Status
                </th>
              </tr>
            </thead>
  
            <tbody>
              {timesheets.map((timesheet, index) => {
                const selectedManager =
                  selectedManagers[timesheet.timesheet_id];
                const selectedReview = timesheet.reviews.find(
                  (review) => review.project_manager_name === selectedManager
                );
  
                return (
                  <tr
                    key={timesheet.timesheet_id}
                    className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      } hover:bg-gray-100 transition duration-200`}
                  >
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-800 whitespace-nowrap">
                      {formatDate(timesheet.week_start_date)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-800 whitespace-nowrap">
                      {formatDate(timesheet.week_end_date)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-800">
                      {timesheet.total_hours}
                    </td>
  
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-800">
                      {timesheet.reviews.length > 0 ? (
                        <select
                          className="border rounded px-2 py-1 text-sm w-full"
                          value={
                            selectedManagers[timesheet.timesheet_id] || ""
                          }
                          onChange={(e) =>
                            setSelectedManagers((prev) => ({
                              ...prev,
                              [timesheet.timesheet_id]: e.target.value,
                            }))
                          }
                        >
                          <option value="">Select Manager</option>
                          {timesheet.reviews.map((review, idx) => (
                            <option
                              key={idx}
                              value={review.project_manager_name}
                            >
                              {review.project_manager_name || "N/A"}
                            </option>
                          ))}
                        </select>
                      ) : (
                        "No reviews"
                      )}
                    </td>
  
                    <td className="px-4 sm:px-6 py-4 text-sm break-words max-w-[250px]">
                      {selectedReview ? (
                        selectedReview.status === "Approved" ? (
                          <div className="text-green-600">
                            <Rating
                              value={selectedReview.rating || 0}
                              precision={1}
                              readOnly
                            />
                            {selectedReview.rating < 3 &&
                              selectedReview.feedback && (
                                <div
                                  className="text-sm mt-1 max-h-[60px] overflow-auto"
                                  style={{
                                    scrollbarWidth: "thin",
                                    scrollbarColor: "#cbd5e0 transparent",
                                  }}
                                >
                                  <strong>Feedback:</strong>{" "}
                                  {selectedReview.feedback}
                                </div>
                              )}
                          </div>
                        ) : selectedReview.status === "Rejected" ? (
                          <div className="text-red-600 font-semibold">
                            <p>{selectedReview.status}</p>
                          </div>
                        ) : null
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-gray-300 text-gray-700 text-xs font-medium">
                          Pending
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-gray-600">No timesheets found.</p>
      )}
    </div>
  );
   
};

export default SavedTimesheet;
