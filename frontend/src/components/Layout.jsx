import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { FiGrid, FiUsers, FiFolder, FiList, FiPlayCircle, FiCpu, FiLogOut, FiMenu, FiX, FiAlertOctagon } from 'react-icons/fi';
import { logoutUser, getLoggedInUserEmail } from '../api/api';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const userEmail = getLoggedInUserEmail();
  const username = userEmail.split('@')[0];

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: <FiGrid /> },
    { name: 'Organizations', path: '/organizations', icon: <FiUsers /> },
    { name: 'Projects', path: '/projects', icon: <FiFolder /> },
    { name: 'Queues', path: '/queues', icon: <FiList /> },
    { name: 'Jobs', path: '/jobs', icon: <FiPlayCircle /> },
    { name: 'Workers', path: '/workers', icon: <FiCpu /> },
    { name: 'Dead Letter Queue', path: '/dead-letter', icon: <FiAlertOctagon /> },
  ];

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="app-container">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}

      {/* Sidebar Navigation */}
      <aside className={`sidebar glass-panel ${sidebarOpen ? 'show' : ''}`}>
        <div className="sidebar-brand">
          <FiCpu className="me-2 text-primary" size={24} />
          <span>Scheduler IO</span>
          <button className="btn d-lg-none ms-auto text-secondary" onClick={closeSidebar}>
            <FiX size={20} />
          </button>
        </div>
        <ul className="sidebar-menu">
          {menuItems.map((item) => (
            <li key={item.name} className="sidebar-item">
              <NavLink
                to={item.path}
                onClick={closeSidebar}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                end={item.path === '/'}
              >
                {item.icon}
                <span>{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="p-3 border-top border-light">
          <button onClick={handleLogout} className="sidebar-link w-100 border-0 bg-transparent text-start text-danger">
            <FiLogOut />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Layout */}
      <div className="main-content">
        {/* Top Navbar */}
        <header className="top-navbar glass-panel">
          <div className="d-flex align-items-center">
            <button className="sidebar-toggle-btn me-3" onClick={toggleSidebar} aria-label="Toggle Sidebar">
              <FiMenu />
            </button>
            <h1 className="h5 mb-0 fw-bold text-primary">Distributed Job Scheduler</h1>
          </div>
          <div className="d-flex align-items-center">
            <span className="me-3 text-muted d-none d-sm-inline">
              Welcome, <strong className="text-dark">{username}</strong>
            </span>
            <button onClick={handleLogout} className="btn btn-outline-danger btn-sm rounded-3 d-flex align-items-center">
              <FiLogOut className="me-1" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Content Page Container */}
        <main className="content-body">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
