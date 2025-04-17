import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(
        '/auth/login',
        { email, password },
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        }
      );
      console.log(res.data);
      navigate('/dashboard');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="flex flex-col-reverse md:flex-row bg-white shadow-xl rounded-2xl overflow-hidden w-full max-w-4xl">
             {/* Image Section */}
             <div className="w-full md:w-1/2 hidden md:block">
          <img
            src="/login-img.png"
            alt="Login Visual"
            className="h-full w-full object-cover"
          />
        </div>
        {/* Login Form Section */}
        <div className="w-full md:w-1/2 p-8 sm:p-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-violet-900 mb-6">
            Login to Your Account
          </h2>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-violet-800 mb-1">
                Email
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-400 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-violet-800 mb-1">
                Password
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-400 transition"
              />
            </div>
            <button
              type="submit"
              className="bg-violet-900 text-white font-semibold py-2 rounded-lg cursor-pointer hover:bg-violet-800 transition duration-200 mt-2"
            >
              Login
            </button>
          </form>
          {msg && (
            <p className="text-red-600 mt-4 text-center text-sm">{msg}</p>
          )}
        </div>

   
      </div>
    </div>
  );
};

export default Login;
