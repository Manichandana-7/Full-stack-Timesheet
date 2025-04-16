// components/Sidebar.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLogOut, FiEdit, FiSave, FiCheckCircle } from 'react-icons/fi';


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
      className="h-screen w-auto p-6 text-white flex flex-col justify-between bg-gradient-to-b from-violet-950 via-purple-900 via-pink-900 to-pink-800"
      // className="bg-gradient-to-b from-violet-950 via-purple-900 via-pink-900 to-pink-800"
    >
      <div>
        <h2
          style={{
            fontSize: '15px',
            marginBottom: '20px',
            textAlign: 'center',
            fontWeight: 'bold',
          }}
        >
          Dashboard
        </h2>

        <div style={{ marginBottom: '40px' }}>
          {/* <p style={{ margin: '0 0 5px 0',  fontWeight: 'bold' }}>Welcome,</p> */}
          {/* <p style={{ margin: '0 0 5px 0' }}>Welcome,{user?.name}</p> */}
          {/* <p style={{ fontSize: '14px', textAlign: 'center' }}>
            Role: <strong>{role}</strong>
          </p> */}
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <span onClick={() => navigate('/timesheet')} className="cursor-pointer flex justify-center items-center gap-2 text-white font-medium text-[16px] mt-2 px-4 py-2 rounded-md hover:bg-white hover:text-purple-900 transition duration-200">
          <FiEdit size={18} />
            Create Timesheet
          </span>
          <span onClick={() => navigate('/dashboard')} className="cursor-pointer flex justify-center items-center gap-2 text-white font-medium text-[16px] mt-2 px-4 py-2 rounded-md hover:bg-white hover:text-purple-900 transition duration-200">
          <FiSave size={18} />
            Saved Timesheet
          </span>

          {role === 'PROJECT_MANAGER' && (
            <span onClick={() => navigate(`/approval/${employeeId}`)} className="cursor-pointer tflex justify-center items-center gap-2 text-white text-center font-medium text-[16px] mt-5 px-4 py-2 rounded-md hover:bg-white hover:text-purple-900 transition duration-200">
              <FiCheckCircle size={18} />
              Timesheet Approval
            </span>
          )}
        </nav>
      </div>

      <span
        onClick={handleLogout}
        className="cursor-pointer text-white flex justify-center items-center gap-2 px-4 py-2 rounded-md hover:bg-white hover:text-purple-900 transition duration-200 font-medium text-[16px] mt-5"
      >
        <FiLogOut size={18} />
        <span>Logout</span>
      </span>
    </aside>
  );
};



export default Sidebar;
