// components/Sidebar.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLogOut } from 'react-icons/fi';

const Sidebar = () => {
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
    <aside
      style={{
        width: 'auto',
        padding: '30px 20px',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
      className="bg-gradient-to-b from-violet-950 via-purple-900 via-pink-900 to-pink-800"
    >
      <div>
        <h2
          style={{
            fontSize: '15px',
            textAlign: 'center',
            marginBottom: '20px',
            fontWeight: 'bold',
          }}
        >
          Dashboard
        </h2>

        <div style={{ marginBottom: '30px' }}>
          <p style={{ margin: '0 0 5px 0', textAlign: 'center', fontWeight: 'bold' }}>{user?.name}</p>
          <p style={{ fontSize: '14px', textAlign: 'center' }}>
            Role: <strong>{role}</strong>
          </p>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <span onClick={() => navigate('/timesheet')} style={navLinkStyle}>
            Create Timesheet
          </span>
          <span onClick={() => navigate('/dashboard')} style={navLinkStyle}>
            Saved Timesheet
          </span>

          {role === 'PROJECT_MANAGER' && (
            <span onClick={() => navigate(`/approval/${employeeId}`)} style={navLinkStyle}>
              Timesheet Approval
            </span>
          )}
        </nav>
      </div>

      <span
        onClick={handleLogout}
        style={{
          ...navLinkStyle,
          color: '#fff',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <FiLogOut size={18} />
        <span>Logout</span>
      </span>
    </aside>
  );
};

const navLinkStyle = {
  cursor: 'pointer',
  fontSize: '16px',
  color: '#fff',
  textDecoration: 'none',
  fontWeight: '500',
  transition: 'opacity 0.2s ease-in-out',
  textAlign: 'center',
  marginTop: '20px',
};

export default Sidebar;
