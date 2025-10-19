import React from 'react';
import './Loader.css';

const Loader = ({ size = 'medium', color = 'green' }) => {
  return (
    <div className="loader-container">
      <div className={`loader loader-${size} loader-${color}`}></div>
      <p className="loader-text">טוען נתונים...</p>
    </div>
  );
};

export default Loader;
