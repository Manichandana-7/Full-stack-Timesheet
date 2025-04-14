// pages/Dashboard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import SavedTimesheet from './SavedTimesheet';
import TimesheetApproval from './TimesheetApproval';

const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const role = user?.role?.toUpperCase();
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear localStorage and redirect to login page
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/'); // Navigate to login page
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <div
        style={{
          width: '250px',
          backgroundColor: '#f4f4f4',
          padding: '20px',
          borderRight: '1px solid #ddd',
        }}
      >
        <h2>Dashboard</h2>
        <h4>Welcome, {user?.name}</h4>
        <h5>Role: {role}</h5>

        <div style={{ marginTop: '2rem' }}>
          {/* Always show Timesheet */}
          <button onClick={() => navigate('/timesheet')}>Timesheet</button>
        </div>

        {/* Show Timesheet Approval only for Project Manager */}
        {role === 'PROJECT_MANAGER' && (
          <div style={{ marginTop: '1rem' }}>
            <button onClick={() => navigate('/timesheet-approval')}>
              Timesheet Approval
            </button>
          </div>
        )}

        {/* Logout Button */}
        <div style={{ marginTop: '2rem' }}>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '2rem' }}>
        {/* Display Timesheet Component */}
        <SavedTimesheet />

        {/* Display TimesheetApproval Component only for Project Managers */}
        {role === 'PROJECT_MANAGER' && <TimesheetApproval />}
      </div>
    </div>
  );
};

export default Dashboard;
