import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import useAppStore from '../store/useAppStore';

export default function Navbar() {
  const user = useAppStore((state) => state.user);
  const logout = useAppStore((state) => state.logout);
  const location = useLocation();

  const handleLogout = () => {
    logout();
  };

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/apps" className="brand-link">Config Vault</Link>
      </div>
      <div className="navbar-menu">
        <Link to="/apps" className={`nav-link ${isActive('/apps')}`}>
          Apps
        </Link>
        {user?.role === 'admin' && (
          <Link to="/users" className={`nav-link ${isActive('/users')}`}>
            Users
          </Link>
        )}
      </div>
      <div className="navbar-user">
        <span className="user-info">
          <span className="username">{user?.username}</span>
          <span className="user-role">{user?.role}</span>
        </span>
        <button className="btn-sm logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}