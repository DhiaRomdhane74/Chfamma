import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="logo">Chfamma?</div>
      <ul className="nav-links">
        <li className={location.pathname === '/' ? 'active' : ''}>
          <Link to="/">Weather</Link>
        </li>
        <li className={location.pathname === '/sports' ? 'active' : ''}>
          <Link to="/sports">Sports</Link>
        </li>
       
        <li className={location.pathname === '/prayer' ? 'active' : ''}>
          <Link to="/prayer">Prayer</Link>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;
