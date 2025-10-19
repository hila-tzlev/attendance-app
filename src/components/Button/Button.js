import React from 'react';
import './Button.css';

const Button = ({ title, onClick, children, disabled, className }) => {
  return (
    <button 
      className={`button ${className || ''}`} 
      onClick={onClick}
      disabled={disabled}
    >
      {children || title}
    </button>
  );
};

export default Button;