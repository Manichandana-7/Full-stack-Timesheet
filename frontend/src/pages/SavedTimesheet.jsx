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
  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState(null);
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
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch timesheets");
        setLoading(false);
      }
    };

    fetchTimesheets();
  }, []);



  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // if (loading) return <div className="text-center text-xl">Loading...</div>;
  // if (error)
  //   return <div className="text-center text-xl text-red-600">{error}</div>;

  return (
    <div className="container mx-auto p-6">

      <h2 className="text-3xl font-semibold mb-6">Saved Timesheets</h2>

      {timesheets.length > 0 ? (
        <table className="min-w-full table-fixed bg-white shadow-md overflow-hidden">
          <thead className="bg-[#1b0c5a] text-white p-2">
            <tr>
              <th className="px-6 py-4 text-left text-md font-semibold w-[150px]">
                Start Date
              </th>
              <th className="px-6 py-4 text-left text-md font-semibold w-[150px]">
                End Date
              </th>
              <th className="px-6 py-4 text-left text-md font-semibold w-[130px]">
                Total Hours
              </th>
              <th className="px-6 py-4 text-left text-md font-semibold w-[200px]">
                Project Managers
              </th>
              <th className="px-6 py-4 text-left text-md font-semibold w-[250px]">
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
                    } hover:bg-gray-100 transition duration-200 cursor-pointer`}
                >
                  <td className="px-6 py-4 text-sm text-gray-800 w-[150px] whitespace-nowrap">
                    {formatDate(timesheet.week_start_date)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800 w-[150px] whitespace-nowrap">
                    {formatDate(timesheet.week_end_date)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800 w-[130px]">
                    {timesheet.total_hours}
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-800 w-[200px]">
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

                  <td className="px-6 py-4 text-sm w-[250px] whitespace-normal break-words">
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
      ) : (
        <p>No timesheets found.</p>
      )}
    </div>
  );
};

export default SavedTimesheet;
