import React from 'react';
import logo from '../../assets/images/logoTzohar.png';
import './Layout.css';

const Layout = ({ children }) => {
  return (
    <div className="layout-container">
      <img src={logo} alt="צוהר הלב לוגו" className="layout-logo" />
      <div className="layout-content">{children}</div>
      <p className="layout-footer">
        צריך עזרה? <a href="https://tzoharhalev.org/contact/">צור קשר</a>
      </p>
    </div>
  );
};

export default Layout;