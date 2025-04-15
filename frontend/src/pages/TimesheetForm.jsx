import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import api from "../api/axios";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

const TimesheetForm = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timesheet, setTimesheet] = useState({ projects: [] });
  const [isFutureDate, setIsFutureDate] = useState(false);
  const [timesheetStatus, setTimesheetStatus] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));
  const employeeId = user?.id;

  const getWeekDates = (date) => {
    // Get the day of the week (0 = Sunday, 6 = Saturday)
    const dayOfWeek = date.getDay();
    // Calculate the difference to get Monday (if dayOfWeek is Sunday (0), we subtract 6, otherwise we subtract the correct number)
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
  const weekStartDate = weekDates[0].toLocaleDateString("en-CA"); // Ensure you pass the correct date format

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
  
    // Fetch entries
    api.get('/timesheet/entries', {
      params: {
        employee_id: employeeId,
        week_start_date: weekStartDate
      }
    })
    .then(response => {
      const fetchedEntries = response.data || [];
  
      // If no entries found for the week, return empty timesheet
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
        // Populate saved entries
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
  
      // Fetch timesheet status after entries are loaded
      api.get('/timesheet/timesheets', {
        params: {
          employee_id: employeeId,
          week_start_date: weekStartDate
        }
      })
      .then(timesheetResponse => {
        const timesheetData = timesheetResponse.data;
        if (timesheetData && timesheetData.status) {
          setTimesheetStatus(timesheetData.status); // This assumes you already have `setTimesheetStatus` in state
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
      if(status === "Submitted"){
        navigate("/dashboard");
      }
  };

  const formatDate = (date) => {
    const options = { day: "2-digit", month: "2-digit", year: "numeric" };
    return new Intl.DateTimeFormat("en-GB", options).format(date);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-center mb-4">Submit Timesheet</h2>

      <div className="mb-6">
        <Calendar
          onChange={handleDateChange}
          value={selectedDate}
          tileDisabled={({ date }) => date > new Date()}
        />
      </div>

      <p className="text-center text-lg mb-4">
        Selected Week: {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
      </p>

      <form
        onSubmit={(e) => handleSaveSubmit(e, "submit")}
        className="space-y-6"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse border border-gray-300">
            <thead>
              <tr>
                <th className="p-2 border">Project</th>
                <th className="p-2 border">Task</th>
                {weekDates.map((date, index) => (
                  <th key={index} className="p-2 border text-center">
                    {`${date.toLocaleString("en-US", {
                      weekday: "short",
                    })} (${formatDate(date)})`}
                  </th>
                ))}
                <th className="p-2 border">Comments</th>
                <th className="p-2 border">Row Sum</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {timesheet.projects.map((project) =>
                project.rows.map((row, rowIndex) => (
                  <tr key={`${project.project_id}-${rowIndex}`}>
                    <td className="p-2 border">
                      {
                        projects.find(
                          (p) => p.project_id === project.project_id
                        )?.project_name
                      }
                    </td>
                    <td className="p-2 border">
                      <select
                        value={row.task_id}
                        onChange={(e) =>
                          handleTaskChange(e, project.project_id, rowIndex)
                        }
                        onFocus={() =>
                          handleProjectChange(project.project_id, rowIndex)
                        }
                        className="w-full p-2 border rounded"
                      >
                        <option value="">Select Task</option>
                        {row.tasks.map((task) => (
                          <option key={task.task_id} value={task.task_id}>
                            {task.task_name}
                          </option>
                        ))}
                      </select>
                    </td>
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                      (day, index) => (
                        <td key={index} className="p-2 border">
                          <input
                            type="number"
                            value={row.hours[day] || ""}
                            onChange={(e) =>
                              handleInputChange(
                                e,
                                project.project_id,
                                rowIndex,
                                day
                              )
                            }
                            min="0"
                            max="24"
                            step="0.5"
                            className="w-full p-2 border rounded"
                          />
                        </td>
                      )
                    )}
                    <td className="p-2 border">
                      <input
                        type="text"
                        value={row.comments}
                        onChange={(e) =>
                          handleCommentChange(e, project.project_id, rowIndex)
                        }
                        placeholder="Optional"
                        className="w-full p-2 border rounded"
                      />
                    </td>
                    <td className="p-2 border">{calculateRowSum(row)}</td>
                    <td className="p-2 border text-center">
                      {rowIndex === project.rows.length - 1 && (
                        <button
                          type="button"
                          onClick={() => handleAddRow(project.project_id)}
                          className="text-green-600 font-bold mr-2"
                        >
                          +
                        </button>
                      )}
                      {project.rows.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveRow(project.project_id, rowIndex)
                          }
                          className="text-red-600 font-bold"
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

        <div className="text-center space-x-4 mt-4">
          <button
            type="button"
            onClick={(e) => handleSaveSubmit(e, "save")}
            className={`bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 ${
              isFutureDate ||
              ["Submitted", "Approved", "Rejected"].includes(timesheetStatus)
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
            disabled={
              isFutureDate ||
              ["Submitted", "Approved", "Rejected"].includes(timesheetStatus)
            }
          >
            Save Timesheet
          </button>

          <button
            type="submit"
            onClick={(e) => handleSaveSubmit(e, "submit")}
            className={`bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 ${
              isFutureDate ||
              ["Submitted", "Approved", "Rejected"].includes(timesheetStatus)
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
            disabled={
              isFutureDate ||
              ["Submitted", "Approved", "Rejected"].includes(timesheetStatus)
            }
          >
            Submit Timesheet
          </button>
        </div>
      </form>

      {isFutureDate && (
        <p className="text-center text-red-500 mt-4">
          You cannot fill out the timesheet for future weeks.
        </p>
      )}
    </div>
  );
};

export default TimesheetForm;
