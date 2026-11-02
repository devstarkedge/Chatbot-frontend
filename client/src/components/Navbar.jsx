import React from 'react';
import { Bot, LogOut } from 'lucide-react';

function Navbar({ currentUser, onLogout }) {
  return (
    <nav className="navbar">
      <a href="#home" className="brand-logo" id="brand-logo-link">
        <div className="brand-icon-wrapper">
          <Bot size={22} color="#fff" />
        </div>
        <span>
          Stark<span style={{ color: 'var(--accent-primary)' }}>Chat</span>
        </span>
      </a>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div className="brand-status-badge" id="db-status-badge">
          <span className="status-dot"></span>
          <span>
            MongoDB: <strong style={{ color: '#fff' }}>test_copy</strong> (
            <span style={{ color: '#38bdf8' }}>users</span>)
          </span>
        </div>

        {currentUser && (
          <div className="user-nav-badge" id="nav-user-badge">
            <div className="user-nav-avatar">
              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
              {currentUser.name}
            </span>
            <button
              type="button"
              className="btn-logout-small"
              onClick={onLogout}
              title="Sign Out"
              id="navbar-logout-btn"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
