// pages/TimesheetApproval.jsx
import React, { useState } from 'react';

const TimesheetApproval = () => {
  const [timesheetRequests, setTimesheetRequests] = useState([]); // Fetch data from API

  // Fetch timesheet approval data on component mount
  // useEffect(() => { 
  //    // Fetch timesheet data
  // }, []);

  const handleApproval = (timesheetId, status) => {
    // Update approval status (send to backend)
    console.log(`Timesheet ${timesheetId} ${status}`);
  };

  return (
    <div>
      <h2>Timesheet Approval</h2>
      <table>
        <thead>
          <tr>
            <th>Employee</th>
            <th>Task</th>
            <th>Hours Worked</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {timesheetRequests.map((entry) => (
            <tr key={entry.id}>
              <td>{entry.employee}</td>
              <td>{entry.task}</td>
              <td>{entry.hours}</td>
              <td>{entry.status}</td>
              <td>
                <button onClick={() => handleApproval(entry.id, 'approved')}>Approve</button>
                <button onClick={() => handleApproval(entry.id, 'rejected')}>Reject</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TimesheetApproval;
