import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);


  const handleNavClick = () => setMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="logo">Chfamma?</div>
      
      <button
        className={`navbar-toggle${menuOpen ? ' open' : ''}`}
        aria-label="Toggle navigation"
        onClick={() => setMenuOpen(open => !open)}
      >
        <span className="bar"></span>
        <span className="bar"></span>
        <span className="bar"></span>
      </button>
      <ul className={`nav-links${menuOpen ? ' open' : ''}`}>
        <li className={location.pathname === '/' ? 'active' : ''}>
          <Link to="/" onClick={handleNavClick}>Weather</Link>
        </li>
        <li className={location.pathname === '/sports' ? 'active' : ''}>
          <Link to="/sports" onClick={handleNavClick}>Sports</Link>
        </li>
        <li className={location.pathname === '/prayer' ? 'active' : ''}>
          <Link to="/prayer" onClick={handleNavClick}>Prayer</Link>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;
