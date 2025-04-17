import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLogOut, FiEdit, FiSave, FiCheckCircle, FiMenu, FiX } from 'react-icons/fi';
import { jwtDecode } from 'jwt-decode';

const getUserFromCookie = () => {
  const cookie = document.cookie
    .split('; ')
    .find(row => row.startsWith('token='));

  if (!cookie) return null;

  const token = cookie.split('=')[1];

  try {
    const decoded = jwtDecode(token); // { id, name, email, role }
    return decoded;
  } catch (error) {
    console.error('Invalid token:', error);
    return null;
  }
};

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const user = getUserFromCookie();
  const employeeId = user?.id;
  const role = user?.role?.toUpperCase();
  const navigate = useNavigate();

  const handleLogout = () => {
    document.cookie = 'token=; Max-Age=0; path=/;';
    navigate('/');
  };

  const toggleMenu = () => setIsOpen(!isOpen);

  // Close sidebar when route changes
  useEffect(() => {
    const closeOnResize = () => {
      if (window.innerWidth >= 768) setIsOpen(false);
    };
    window.addEventListener('resize', closeOnResize);
    return () => window.removeEventListener('resize', closeOnResize);
  }, []);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-violet-900 text-white p-2 rounded-lg shadow-lg focus:outline-none"
        onClick={toggleMenu}
      >
        {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen w-64 bg-gradient-to-b from-violet-950 via-purple-900 via-pink-900 to-pink-800 p-6 text-white flex flex-col justify-between transition-transform duration-300 z-40 
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:relative md:flex`}
      >
        <div>
          <h2 className="text-center font-bold text-sm mb-6">Dashboard</h2>

          <nav className="flex flex-col gap-4">
            <span
              onClick={() => {
                navigate('/timesheet');
                setIsOpen(false);
              }}
              className="cursor-pointer flex items-center gap-2 text-white font-medium text-[16px] px-4 py-2 rounded-md hover:bg-white hover:text-purple-900 transition"
            >
              <FiEdit size={18} />
              Create Timesheet
            </span>

            <span
              onClick={() => {
                navigate('/dashboard');
                setIsOpen(false);
              }}
              className="cursor-pointer flex items-center gap-2 text-white font-medium text-[16px] px-4 py-2 rounded-md hover:bg-white hover:text-purple-900 transition"
            >
              <FiSave size={18} />
              Saved Timesheet
            </span>

            {role === 'PROJECT_MANAGER' && (
              <span
                onClick={() => {
                  navigate(`/approval/${employeeId}`);
                  setIsOpen(false);
                }}
                className="cursor-pointer flex items-center gap-2 text-white font-medium text-[16px] px-4 py-2 rounded-md hover:bg-white hover:text-purple-900 transition"
              >
                <FiCheckCircle size={18} />
                Timesheet Approval
              </span>
            )}
          </nav>
        </div>

        <span
          onClick={() => {
            handleLogout();
            setIsOpen(false);
          }}
          className="cursor-pointer flex justify-center items-center gap-2 px-4 py-2 rounded-md hover:bg-white hover:text-purple-900 transition font-medium text-[16px] mt-5"
        >
          <FiLogOut size={18} />
          Logout
        </span>
      </aside>
    </>
  );
};

export default Sidebar;
