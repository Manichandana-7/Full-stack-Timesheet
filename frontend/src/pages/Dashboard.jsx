// pages/Dashboard.jsx
import React from 'react';
import Sidebar from './Sidebar';
import SavedTimesheet from './SavedTimesheet';

const Dashboard = () => {
  return (
    <div className="flex flex-col md:flex-row min-h-screen font-sans bg-gray-50">
      {/* Sidebar - top on mobile, left on larger screens */}
      <div className="w-full md:w-64 bg-white shadow md:shadow-none">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 md:p-10 overflow-y-auto">
        <div className="max-w-full mx-auto">
          <SavedTimesheet />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
