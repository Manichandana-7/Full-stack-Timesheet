// pages/Dashboard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import SavedTimesheet from './SavedTimesheet';
import TimesheetApproval from './TimesheetApproval';

const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const employeeId = user?.id;
  const role = user?.role?.toUpperCase();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Segoe UI, sans-serif', backgroundColor: '#f9fafb' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: '250px',
          backgroundColor: '#ffffff',
          padding: '30px 20px',
          borderRight: '1px solid #e0e0e0',
          boxShadow: '2px 0 5px rgba(0, 0, 0, 0.05)',
        }}
      >
        <h2 style={{ fontSize: '24px', marginBottom: '10px', color: '#4caf50' }}>Dashboard</h2>
        <div style={{ marginBottom: '30px' }}>
          <p style={{ margin: '5px 0', fontWeight: 'bold' }}>Welcome,</p>
          <p style={{ margin: '0 0 5px 0', color: '#333' }}>{user?.name}</p>
          <p style={{ fontSize: '14px', color: '#666' }}>Role: <strong>{role}</strong></p>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <button
            onClick={() => navigate('/timesheet')}
            style={buttonStyle}
          >
            Timesheet
          </button>

          {role === 'PROJECT_MANAGER' && (
            <button
              onClick={() => navigate(`/approval/${employeeId}`)}
              style={buttonStyle}
            >
              Timesheet Approval
            </button>
          )}

          <button
            onClick={handleLogout}
            style={{ ...buttonStyle, backgroundColor: '#e53935' }}
          >
            Logout
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '40px' }}>
        <SavedTimesheet />

        {/* Uncomment if you want to render TimesheetApproval directly */}
        {/* {role === 'PROJECT_MANAGER' && <TimesheetApproval />} */}
      </main>
    </div>
  );
};

const buttonStyle = {
  padding: '10px 20px',
  fontSize: '16px',
  color: '#fff',
  backgroundColor: '#4caf50',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  transition: 'background-color 0.2s ease-in-out',
};

export default Dashboard;
