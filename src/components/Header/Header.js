import React from 'react';
import logo from '../../assets/images/logoTzohar.png';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <img src={logo} alt="צוהר הלב לוגו" className="header-logo" />
    </header>
  );
};

export default Header;