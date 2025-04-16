import React, {  useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import TimesheetForm from './pages/TimesheetForm';
import TimesheetCard from './pages/TimesheetCard';
import TimesheetApproval from './pages/TimesheetApproval';
import Dashboard from './pages/Dashboard';

const App = () => {


  return (
    <Routes>
      {/* <Route path="/" element={!auth.token ? <Login setAuth={setAuth} /> : <Navigate to="/dashboard" />} /> */}
      <Route path="/" element={ <Login  /> } />
      <Route path="/dashboard" element={<Dashboard  /> }/>
      <Route path="/timesheet" element={<TimesheetForm /> } />
      {/* <Route path="/timesheetcard/:timesheetId" element={<TimesheetCard /> : <Navigate to="/" />} /> */}
      <Route path="/approval/:managerId" element={<TimesheetApproval /> } />
    </Routes>
  );
};

export default App;
