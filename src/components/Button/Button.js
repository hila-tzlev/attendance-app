import React from 'react';
import './Button.css';

const Button = ({ title, onClick, children }) => {
  return (
    <button className="button" onClick={onClick}>
      {children || title}
    </button>
  );
};

export default Button;