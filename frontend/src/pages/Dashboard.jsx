// pages/Dashboard.jsx
import React from 'react';
import Sidebar from './Sidebar';
import SavedTimesheet from './SavedTimesheet';

const Dashboard = () => {
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

      <main style={{ flex: 1, padding: '40px' }} className="ml-64">
        <SavedTimesheet />
      </main>
    </div>
  );
};

export default Dashboard;
