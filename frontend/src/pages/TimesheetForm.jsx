import React, { useState, useEffect } from "react";
import api from '../api/axios';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const TimesheetForm = () => {
  const [projects, setProjects] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timesheet, setTimesheet] = useState({ projects: [] });
  const [isFutureDate, setIsFutureDate] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));
  const employeeId = user?.id;

  useEffect(() => {
    if (!employeeId) return;

    api.get(`timesheet/projects/${employeeId}`)
      .then(response => {
        setProjects(response.data);

        const initializedProjects = response.data.map(project => ({
          project_id: project.project_id,
          rows: [
            {
              task_id: "",
              tasks: [],
              hours: {
                Mon: "", Tue: "", Wed: "", Thu: "", Fri: "", Sat: "", Sun: ""
              },
              comments: ""
            }
          ]
        }));

        setTimesheet({ projects: initializedProjects });
      })
      .catch(error => console.error("Error fetching projects:", error));
  }, [employeeId]);

  const handleProjectChange = (projectId, rowIndex) => {
    api.get(`timesheet/tasks/${projectId}`)
      .then(response => {
        setTimesheet(prev => ({
          projects: prev.projects.map(p => {
            if (p.project_id === projectId) {
              const updatedRows = [...p.rows];
              updatedRows[rowIndex].tasks = response.data;
              return { ...p, rows: updatedRows };
            }
            return p;
          })
        }));
      })
      .catch(error => console.error("Error fetching tasks:", error));
  };

  const getWeekDates = (date) => {
    const dayOfWeek = date.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(date.setDate(date.getDate() + diffToMonday));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  };

  const weekDates = getWeekDates(new Date(selectedDate));

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setIsFutureDate(date > new Date());
  };

  const handleInputChange = (e, projectId, rowIndex, dayName) => {
    const { value } = e.target;
    setTimesheet(prev => ({
      projects: prev.projects.map(p => {
        if (p.project_id === projectId) {
          const updatedRows = [...p.rows];
          updatedRows[rowIndex].hours[dayName] = value;
          return { ...p, rows: updatedRows };
        }
        return p;
      })
    }));
  };

  const handleCommentChange = (e, projectId, rowIndex) => {
    const { value } = e.target;
    setTimesheet(prev => ({
      projects: prev.projects.map(p => {
        if (p.project_id === projectId) {
          const updatedRows = [...p.rows];
          updatedRows[rowIndex].comments = value;
          return { ...p, rows: updatedRows };
        }
        return p;
      })
    }));
  };

  const handleTaskChange = (e, projectId, rowIndex) => {
    const { value } = e.target;
    setTimesheet(prev => ({
      projects: prev.projects.map(p => {
        if (p.project_id === projectId) {
          const updatedRows = [...p.rows];
          updatedRows[rowIndex].task_id = value;
          return { ...p, rows: updatedRows };
        }
        return p;
      })
    }));
  };

  const handleAddRow = (projectId) => {
    setTimesheet(prev => ({
      projects: prev.projects.map(p => {
        if (p.project_id === projectId) {
          return {
            ...p,
            rows: [
              ...p.rows,
              {
                task_id: "",
                tasks: [],
                hours: {
                  Mon: "", Tue: "", Wed: "", Thu: "", Fri: "", Sat: "", Sun: ""
                },
                comments: ""
              }
            ]
          };
        }
        return p;
      })
    }));
  };

  const handleRemoveRow = async (projectId, rowIndex) => {
    const project = timesheet.projects.find(p => p.project_id === projectId);
    const row = project?.rows?.[rowIndex];
    const weekStartDate = weekDates[0].toISOString().split("T")[0]; // ✅ Get YYYY-MM-DD
    // const timesheetId = timesheet?.timesheet_id; // ✅ Use timesheet_id instead of employee_id
    const user = JSON.parse(localStorage.getItem("user"));
    const employeeId = user?.id;
    // If the row has been saved (has task_id), delete from backend
    if (row?.task_id) {
      try {
        await api.delete('/timesheet/entries', {
          params: {
            // timesheet_id: timesheetId,
            employee_id: employeeId,
            week_start_date: weekStartDate,
            project_id: projectId,
            task_id: row.task_id
          }
        });
        console.log("✅ Entry deleted from backend.");
      } catch (error) {
        console.error("❌ Failed to delete entry from backend:", error);
      }
    }
  
    // Remove the row from UI state
    setTimesheet(prev => ({
      ...prev,
      projects: prev.projects.map(p => {
        if (p.project_id === projectId) {
          const updatedRows = [...p.rows];
          updatedRows.splice(rowIndex, 1);
          return { ...p, rows: updatedRows };
        }
        return p;
      })
    }));
  };
  

  const calculateRowSum = (row) => {
    const hours = row?.hours || {};
    return Object.values(hours).reduce((sum, hour) => {
      const parsed = parseFloat(hour);
      return sum + (isNaN(parsed) ? 0 : parsed);
    }, 0);
  };

  const handleSaveSubmit = (e, type) => {
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

    const entries = timesheet.projects.flatMap(p =>
      p.rows
        .filter(row => row.task_id)
        .map(row => ({
          project_id: p.project_id,
          task_id: parseInt(row.task_id),
          mon_hours: parseFloat(row.hours.Mon) || 0,
          tue_hours: parseFloat(row.hours.Tue) || 0,
          wed_hours: parseFloat(row.hours.Wed) || 0,
          thu_hours: parseFloat(row.hours.Thu) || 0,
          fri_hours: parseFloat(row.hours.Fri) || 0,
          sat_hours: parseFloat(row.hours.Sat) || 0,
          sun_hours: parseFloat(row.hours.Sun) || 0,
          comments: row.comments || ""
        }))
    );

    const payload = {
      employee_id: parseInt(employeeId),
      week_start_date: weekDates[0].toISOString().split("T")[0],
      week_end_date: weekDates[6].toISOString().split("T")[0],
      status,
      entries
    };

    console.log("📤 Payload:", payload);

    api.post(`/timesheet/timesheets`, payload)
      .then(() => {
        alert(`✅ Timesheet ${status.toLowerCase()} successfully!`);
      })
      .catch(error => {
        console.error("❌ Error saving/submitting timesheet:", error);
        alert("An error occurred while saving/submitting the timesheet.");
      });
  };

  const formatDate = (date) => {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Intl.DateTimeFormat('en-GB', options).format(date);
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

      <form onSubmit={(e) => handleSaveSubmit(e, "submit")} className="space-y-6">
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse border border-gray-300">
            <thead>
              <tr>
                <th className="p-2 border">Project</th>
                <th className="p-2 border">Task</th>
                {weekDates.map((date, index) => (
                  <th key={index} className="p-2 border text-center">
                    {`${date.toLocaleString('en-US', { weekday: 'short' })} (${formatDate(date)})`}
                  </th>
                ))}
                <th className="p-2 border">Comments</th>
                <th className="p-2 border">Row Sum</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {timesheet.projects.map(project => (
                project.rows.map((row, rowIndex) => (
                  <tr key={`${project.project_id}-${rowIndex}`}>
                    <td className="p-2 border">{projects.find(p => p.project_id === project.project_id)?.project_name}</td>
                    <td className="p-2 border">
                      <select
                        value={row.task_id}
                        onChange={(e) => handleTaskChange(e, project.project_id, rowIndex)}
                        onFocus={() => handleProjectChange(project.project_id, rowIndex)}
                        className="w-full p-2 border rounded"
                      >
                        <option value="">Select Task</option>
                        {row.tasks.map(task => (
                          <option key={task.task_id} value={task.task_id}>{task.task_name}</option>
                        ))}
                      </select>
                    </td>
                    {weekDates.map((date, index) => {
                      const day = date.toLocaleString('en-US', { weekday: 'short' });
                      return (
                        <td key={index} className="p-2 border">
                          <input
                            type="number"
                            value={row.hours[day] || ""}
                            onChange={(e) => handleInputChange(e, project.project_id, rowIndex, day)}
                            min="0"
                            max="24"
                            step="0.5"
                            className="w-full p-2 border rounded"
                          />
                        </td>
                      );
                    })}
                    <td className="p-2 border">
                      <input
                        type="text"
                        value={row.comments}
                        onChange={(e) => handleCommentChange(e, project.project_id, rowIndex)}
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
                          onClick={() => handleRemoveRow(project.project_id, rowIndex)}
                          className="text-red-600 font-bold"
                        >
                          −
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-center space-x-4 mt-4">
          <button
            type="button"
            onClick={(e) => handleSaveSubmit(e, "save")}
            className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
          >
            Save Timesheet
          </button>
          <button
            type="submit"
            className={`bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 ${isFutureDate ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isFutureDate}
          >
            Submit Timesheet
          </button>
        </div>
      </form>

      {isFutureDate && (
        <p className="text-center text-red-500 mt-4">You cannot fill out the timesheet for future weeks.</p>
      )}
    </div>
  );
};

export default TimesheetForm;
