import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import api from "../api/axios";
import Calendar from "react-calendar";
import Sidebar from './Sidebar';
import "react-calendar/dist/Calendar.css";

const TimesheetForm = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timesheet, setTimesheet] = useState({ projects: [] });
  const [isFutureDate, setIsFutureDate] = useState(false);
  const [timesheetStatus, setTimesheetStatus] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const user = JSON.parse(localStorage.getItem("user"));
  const employeeId = user?.id;

  const getWeekDates = (date) => {
    const dayOfWeek = date.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(date);
    monday.setDate(date.getDate() - diffToMonday);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  };

  const weekDates = getWeekDates(new Date(selectedDate));
  const weekStartDate = weekDates[0].toLocaleDateString("en-CA");

  useEffect(() => {
    if (!employeeId) return;

    api
      .get(`timesheet/projects/${employeeId}`)
      .then((response) => {
        setProjects(response.data);

        const initializedProjects = response.data.map((project) => ({
          project_id: project.project_id,
          rows: [
            {
              task_id: "",
              tasks: [],
              hours: {
                Mon: "",
                Tue: "",
                Wed: "",
                Thu: "",
                Fri: "",
                Sat: "",
                Sun: "",
              },
              comments: "",
            },
          ],
        }));

        setTimesheet({ projects: initializedProjects });
      })
      .catch((error) => console.error("Error fetching projects:", error));
  }, [employeeId]);

  useEffect(() => {
    if (!employeeId) return;

    setIsFutureDate(selectedDate > new Date());
    console.log('Fetching timesheet for employee_id:', employeeId, 'week_start_date:', weekStartDate);

    api.get('/timesheet/entries', {
      params: {
        employee_id: employeeId,
        week_start_date: weekStartDate
      }
    })
      .then(response => {
        const fetchedEntries = response.data || [];

        if (fetchedEntries.length === 0) {
          const emptyProjects = projects.map(project => ({
            project_id: project.project_id,
            rows: [
              {
                task_id: "",
                tasks: [],
                hours: { Mon: "", Tue: "", Wed: "", Thu: "", Fri: "", Sat: "", Sun: "" },
                comments: ""
              }
            ]
          }));
          setTimesheet({ projects: emptyProjects });
        } else {
          const updatedProjects = projects.map(project => {
            const projectEntries = fetchedEntries.filter(entry => entry.project_id === project.project_id);

            if (projectEntries.length === 0) {
              return {
                project_id: project.project_id,
                rows: [
                  {
                    task_id: "",
                    tasks: [],
                    hours: { Mon: "", Tue: "", Wed: "", Thu: "", Fri: "", Sat: "", Sun: "" },
                    comments: ""
                  }
                ]
              };
            }

            const rows = projectEntries.map(entry => ({
              task_id: entry.task_id.toString(),
              tasks: [],
              hours: {
                Mon: entry.mon_hours?.toString() || "",
                Tue: entry.tue_hours?.toString() || "",
                Wed: entry.wed_hours?.toString() || "",
                Thu: entry.thu_hours?.toString() || "",
                Fri: entry.fri_hours?.toString() || "",
                Sat: entry.sat_hours?.toString() || "",
                Sun: entry.sun_hours?.toString() || ""
              },
              comments: entry.comments || ""
            }));

            return { project_id: project.project_id, rows };
          });

          setTimesheet({ projects: updatedProjects });
        }

        api.get('/timesheet/timesheets', {
          params: {
            employee_id: employeeId,
            week_start_date: weekStartDate
          }
        })
          .then(timesheetResponse => {
            const timesheetData = timesheetResponse.data;
            if (timesheetData && timesheetData.status) {
              setTimesheetStatus(timesheetData.status);
            } else {
              setTimesheetStatus("");
            }
          })
          .catch(error => {
            console.error("Error fetching timesheet status:", error);
          });

      })
      .catch(error => console.error("Error fetching saved entries:", error));
  }, [selectedDate, employeeId, projects]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handleProjectChange = (projectId, rowIndex) => {
    api
      .get(`timesheet/tasks/${projectId}`)
      .then((response) => {
        setTimesheet((prev) => ({
          projects: prev.projects.map((p) => {
            if (p.project_id === projectId) {
              const updatedRows = [...p.rows];
              updatedRows[rowIndex].tasks = response.data;
              return { ...p, rows: updatedRows };
            }
            return p;
          }),
        }));
      })
      .catch((error) => console.error("Error fetching tasks:", error));
  };

  const handleInputChange = (e, projectId, rowIndex, dayName) => {
    const { value } = e.target;
    setTimesheet((prev) => ({
      projects: prev.projects.map((p) => {
        if (p.project_id === projectId) {
          const updatedRows = [...p.rows];
          updatedRows[rowIndex].hours[dayName] = value;
          return { ...p, rows: updatedRows };
        }
        return p;
      }),
    }));
  };

  const handleCommentChange = (e, projectId, rowIndex) => {
    const { value } = e.target;
    setTimesheet((prev) => ({
      projects: prev.projects.map((p) => {
        if (p.project_id === projectId) {
          const updatedRows = [...p.rows];
          updatedRows[rowIndex].comments = value;
          return { ...p, rows: updatedRows };
        }
        return p;
      }),
    }));
  };

  const handleTaskChange = (e, projectId, rowIndex) => {
    const { value } = e.target;
    setTimesheet((prev) => ({
      projects: prev.projects.map((p) => {
        if (p.project_id === projectId) {
          const updatedRows = [...p.rows];
          updatedRows[rowIndex].task_id = value;
          return { ...p, rows: updatedRows };
        }
        return p;
      }),
    }));
  };

  const handleAddRow = (projectId) => {
    setTimesheet((prev) => ({
      projects: prev.projects.map((p) => {
        if (p.project_id === projectId) {
          return {
            ...p,
            rows: [
              ...p.rows,
              {
                task_id: "",
                tasks: [],
                hours: {
                  Mon: "",
                  Tue: "",
                  Wed: "",
                  Thu: "",
                  Fri: "",
                  Sat: "",
                  Sun: "",
                },
                comments: "",
              },
            ],
          };
        }
        return p;
      }),
    }));
  };

  const handleRemoveRow = async (projectId, rowIndex) => {
    const project = timesheet.projects.find((p) => p.project_id === projectId);
    const row = project?.rows?.[rowIndex];

    if (row?.task_id) {
      try {
        await api.delete("/timesheet/entries", {
          params: {
            employee_id: employeeId,
            week_start_date: weekStartDate,
            project_id: projectId,
            task_id: row.task_id,
          },
        });
        console.log("Entry deleted from backend.");
      } catch (error) {
        console.error("Failed to delete entry from backend:", error);
      }
    }

    setTimesheet((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => {
        if (p.project_id === projectId) {
          const updatedRows = [...p.rows];
          updatedRows.splice(rowIndex, 1);
          return { ...p, rows: updatedRows };
        }
        return p;
      }),
    }));
  };

  const calculateRowSum = (row) => {
    const hours = row?.hours || {};
    return Object.values(hours).reduce((sum, hour) => {
      const parsed = parseFloat(hour);
      return sum + (isNaN(parsed) ? 0 : parsed);
    }, 0);
  };

  const handleSaveSubmit = async (e, type) => {
    e.preventDefault();

    if (isFutureDate) {
      alert("You cannot fill out the timesheet for future dates.");
      return;
    }

    if (!employeeId) {
      alert("Employee ID not found. Please login again.");
      return;
    }

    const status = type === "submit" ? "Submitted" : "Saved";

    const entries = timesheet.projects.flatMap((p) =>
      p.rows
        .filter((row) => row.task_id)
        .map((row) => ({
          employee_id: parseInt(employeeId),
          project_id: p.project_id,
          task_id: parseInt(row.task_id),
          mon_hours: parseFloat(row.hours.Mon) || 0,
          tue_hours: parseFloat(row.hours.Tue) || 0,
          wed_hours: parseFloat(row.hours.Wed) || 0,
          thu_hours: parseFloat(row.hours.Thu) || 0,
          fri_hours: parseFloat(row.hours.Fri) || 0,
          sat_hours: parseFloat(row.hours.Sat) || 0,
          sun_hours: parseFloat(row.hours.Sun) || 0,
          comments: row.comments || "",
        }))
    );

    const payload = {
      employee_id: parseInt(employeeId),
      week_start_date: weekDates[0].toLocaleDateString("en-CA"),
      week_end_date: weekDates[6].toLocaleDateString("en-CA"),
      status,
      entries,
    };

    api
      .post(`/timesheet/timesheets`, payload)
      .then(() => {
        alert(`Timesheet ${status.toLowerCase()} successfully!`);
      })
      .catch((error) => {
        console.error("Error saving/submitting timesheet:", error);
        alert("An error occurred while saving/submitting the timesheet.");
      });
    if (status === "Submitted") {
      navigate("/dashboard");
    }
  };

  const formatDate = (date) => {
    const options = { day: "2-digit", month: "2-digit", year: "numeric" };
    return new Intl.DateTimeFormat("en-GB", options).format(date);
  };

  const isDisabled = isFutureDate || ["Submitted", "Approved", "Rejected"].includes(timesheetStatus);

  return (

    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        fontFamily: 'Segoe UI, sans-serif',
        backgroundColor: '#f9fafb',
      }}
    >
      <Sidebar />

      <main style={{ flex: 1, padding: '40px' }}>
       

    <div className="p-5">
      <h2 className="text-3xl font-semibold text-center text-gray-900 mb-6">Timesheet Submission</h2>

      <div className="mb-8 text-center relative">
        <button
          onClick={() => setShowCalendar((prev) => !prev)}
          className="bg-gray-200 text-gray-800 font-semibold px-4 py-2 rounded hover:bg-gray-300 transition"
        >
          {showCalendar ? "Hide Calendar" : "Select Week"}
        </button>

        <div
          className={`transition-all duration-300 overflow-hidden ${showCalendar ? "max-h-[400px] mt-4" : "max-h-0"
            }`}
        >
          <div className="mx-auto inline-block border border-gray-300 rounded shadow-md p-4">
            <Calendar
              onChange={handleDateChange}
              value={selectedDate}
              tileDisabled={({ date }) => date > new Date()}
            />
          </div>
        </div>
      </div>

      <p className="text-center text-xl font-medium text-gray-700 mb-6">
        Selected Week: {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
      </p>

      <form
        onSubmit={(e) => handleSaveSubmit(e, "submit")}
        className="space-y-8"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse">
            <thead className="bg-[#1b0c5a] text-white p-2">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Project Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Task</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Comment</th>
                {weekDates.map((date, index) => (
                  <th key={index} className="px-6 py-3 text-left text-sm font-semibold">
                    {`${date.toLocaleString("en-US", { weekday: "short" })} ${date.getDate()}`}
                  </th>
                ))}
                <th className="px-6 py-3 text-left text-sm font-semibold">Total</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="m-3">
              {timesheet.projects.map((project) =>
                project.rows.map((row, rowIndex) => (
                  <tr key={`${project.project_id}-${rowIndex}`} className="">
                    <td className="p-2 border-b text-gray-700">
                      {projects.find((p) => p.project_id === project.project_id)?.project_name}
                    </td>
                    <td className="p-2 border-b">
                      <select
                        value={row.task_id}
                        onChange={(e) => handleTaskChange(e, project.project_id, rowIndex)}
                        onFocus={() => handleProjectChange(project.project_id, rowIndex)}
                        className="w-full p-2 bg-gray-100 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-100 hover:shadow-sm hover:scale-[1.01] hover:z-3 transition duration-10" disabled={isDisabled}
                      >
                        <option value="">Select Task</option>
                        {row.tasks.map((task) => (
                          <option key={task.task_id} value={task.task_id}>
                            {task.task_name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2 border-b">
                      <input
                        type="text"
                        value={row.comments}
                        onChange={(e) => handleCommentChange(e, project.project_id, rowIndex)}
                        placeholder="Optional"
                        className="w-full p-2 bg-gray-100 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-100 hover:shadow-sm hover:scale-[1.01] hover:z-3 transition duration-10"

                        disabled={isDisabled}
                      />
                    </td>
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => (
                      <td key={index} className="p-2 border-b text-center">
                        <input
                          type="number"
                          value={row.hours[day] || ""}
                          onChange={(e) => {
                            let value = e.target.value;
                            if (value === "") {
                              handleInputChange(e, project.project_id, rowIndex, day);
                              return;
                            }

                            const numValue = parseFloat(value);
                            if (!isNaN(numValue)) {
                              if (numValue < 0) {
                                value = "0";
                              } else if (numValue > 10) {
                                value = "10";
                              } else {
                                const decimalPart = (numValue * 10) % 10;
                                if (decimalPart !== 0 && decimalPart !== 5) {
                                  value = (Math.round(numValue * 2) / 2).toFixed(1);
                                }
                              }

                              e.target.value = value;
                              handleInputChange(e, project.project_id, rowIndex, day);
                            }
                          }}
                          onBlur={(e) => {
                            if (e.target.value && !isNaN(parseFloat(e.target.value))) {
                              e.target.value = parseFloat(e.target.value).toFixed(1);
                              handleInputChange(e, project.project_id, rowIndex, day);
                            }
                          }}
                          min="0"
                          max="10"
                          step="0.5"
                          className="w-full p-2 bg-gray-100 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-100 hover:shadow-sm hover:scale-[1.01] hover:z-3 transition duration-10" disabled={isDisabled}
                        />
                      </td>
                    ))}

                    <td className="p-2 border-b text-center">{calculateRowSum(row)}</td>
                    <td className="p-2 border-b text-center">
                      {rowIndex === project.rows.length - 1 && (
                        <button
                          type="button"
                          onClick={() => handleAddRow(project.project_id)}
                          className="text-blue-600 font-semibold mr-2 hover:text-blue-700"
                          disabled={isDisabled}
                        >
                          +
                        </button>
                      )}
                      {project.rows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(project.project_id, rowIndex)}
                          className="text-blue-600 font-semibold hover:text-blue-700"
                          disabled={isDisabled}
                        >
                          −
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="text-center space-x-6 mt-6">
          <button
            type="button"
            onClick={(e) => handleSaveSubmit(e, "save")}
            className={`py-2 px-6 rounded font-semibold focus:outline-none transition ${isDisabled
                ? "bg-indigo-300 text-gray-200 cursor-not-allowed"
                : "bg-indigo-900 text-white hover:bg-indigo-800"
              }`}
            disabled={isDisabled}
          >
            SAVE
          </button>

          <button
            type="submit"
            className={`py-2 px-6 rounded font-semibold flex items-center inline-flex justify-center focus:outline-none transition ${isDisabled
                ? "bg-pink-300 text-gray-200 cursor-not-allowed"
                : "bg-pink-500 text-white hover:bg-pink-600"
              }`}
            disabled={isDisabled}
          >
            SUBMIT
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
            </svg>
          </button>
        </div>

      </form>

      {isFutureDate && (
        <p className="text-center text-red-600 mt-6">
          You cannot fill out the timesheet for future weeks.
        </p>
      )}
    </div>
    </main>
    </div>
  );
};
export default TimesheetForm;