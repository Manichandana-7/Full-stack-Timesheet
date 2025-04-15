import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const TimesheetCard = ({ timesheetId, onSaveSuccess }) => {
  const [timesheet, setTimesheet] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weekDates, setWeekDates] = useState([]);

  useEffect(() => {
    const fetchTimesheetData = async () => {
      try {
        // Fetch timesheet details
        const { data: timesheetData } = await api.get(
          `/savedsheets/timesheets/${timesheetId}`
        );

        // Generate week dates from stored timesheet dates
        const startDate = new Date(timesheetData.timesheet.week_start_date);
        const endDate = new Date(timesheetData.timesheet.week_end_date);
        const dates = getWeekDates(startDate);
        setWeekDates(dates);

        // Fetch entries for this timesheet
        const { data: entriesData } = await api.get(
          `/savedsheets/entries`,
          { params: { timesheet_id: timesheetId } }
        );

        setTimesheet(timesheetData.timesheet);
        setEntries(entriesData || []);
        setLoading(false);
      } catch (err) {
        setError('Failed to load timesheet data');
        setLoading(false);
        console.error('Error:', err);
      }
    };

    fetchTimesheetData();
  }, [timesheetId]);

  // Helper function to generate week dates
  const getWeekDates = (startDate) => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      return d;
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleSubmit = async (status) => {
    try {
      await api.patch(`/savedsheets/timesheets/${timesheetId}`, {
        status,
        total_hours: entries.reduce((sum, entry) => sum + (entry.total_hours || 0), 0)
      });
      
      alert(`Timesheet ${status.toLowerCase()} successfully!`);
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      console.error('Error updating timesheet:', err);
      alert('Failed to update timesheet');
    }
  };

  const calculateDayHours = (entry, dayName) => {
    // Assuming your entries have properties like mon_hours, tue_hours, etc.
    const dayMap = {
      Mon: 'mon_hours',
      Tue: 'tue_hours',
      Wed: 'wed_hours',
      Thu: 'thu_hours',
      Fri: 'fri_hours',
      Sat: 'sat_hours',
      Sun: 'sun_hours'
    };
    return entry[dayMap[dayName]] || 0;
  };

  if (loading) return <div className="text-center p-4">Loading timesheet data...</div>;
  if (error) return <div className="text-center p-4 text-red-500">{error}</div>;
  if (!timesheet) return <div className="text-center p-4">Timesheet not found</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-center mb-4">
        Timesheet for {formatDate(timesheet.week_start_date)} to {formatDate(timesheet.week_end_date)}
      </h2>

      <div className="mb-4 flex justify-between items-center">
        <div>
          <p className="font-medium">Status: 
            <span className={`ml-2 px-2 py-1 rounded ${
              timesheet.status === 'Submitted' ? 'bg-blue-100 text-blue-800' :
              timesheet.status === 'Saved' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {timesheet.status}
            </span>
          </p>
          <p className="font-medium">Total Hours: {timesheet.total_hours}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 border">Project</th>
              <th className="p-3 border">Task</th>
              {weekDates.map((date, index) => (
                <th key={index} className="p-3 border text-center">
                  {`${date.toLocaleString('en-US', { weekday: 'short' })} (${formatDate(date)})`}
                </th>
              ))}
              <th className="p-3 border">Comments</th>
              <th className="p-3 border">Total</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="p-3 border">{entry.project_name}</td>
                <td className="p-3 border">{entry.task_name}</td>
                {weekDates.map((date) => {
                  const day = date.toLocaleString('en-US', { weekday: 'short' });
                  return (
                    <td key={day} className="p-3 border text-center">
                      {calculateDayHours(entry, day)}
                    </td>
                  );
                })}
                <td className="p-3 border">{entry.comments || '-'}</td>
                <td className="p-3 border font-medium">
                  {Object.values({
                    mon_hours: entry.mon_hours || 0,
                    tue_hours: entry.tue_hours || 0,
                    wed_hours: entry.wed_hours || 0,
                    thu_hours: entry.thu_hours || 0,
                    fri_hours: entry.fri_hours || 0,
                    sat_hours: entry.sat_hours || 0,
                    sun_hours: entry.sun_hours || 0
                  }).reduce((sum, hours) => sum + parseFloat(hours), 0).toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {timesheet.status !== 'Submitted' && timesheet.status !== 'approved' && (
        <div className="text-center space-x-4 mt-6">
          <button
            onClick={() => handleSubmit('Saved')}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded font-medium transition-colors"
          >
            Save Changes
          </button>
          <button
            onClick={() => handleSubmit('Submitted')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded font-medium transition-colors"
          >
            Submit Timesheet
          </button>
        </div>
      )}
    </div>
  );
};

export default TimesheetCard;