import React, {  useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import TimesheetForm from './pages/TimesheetForm';
import TimesheetApproval from './pages/TimesheetApproval';
import Dashboard from './pages/Dashboard';

const App = () => {
  const [auth, setAuth] = useState({
    token: localStorage.getItem('token'),
    user: JSON.parse(localStorage.getItem('user')),
  });

  const role = auth.user?.role?.toUpperCase();

  return (
    <Routes>
      <Route path="/" element={!auth.token ? <Login setAuth={setAuth} /> : <Navigate to="/dashboard" />} />
      <Route path="/dashboard" element={auth.token ? <Dashboard role={role} /> : <Navigate to="/" />}/>
      <Route path="/timesheet" element={auth.token ? <TimesheetForm /> : <Navigate to="/" />} />
    </Routes>
  );
};

export default App;
