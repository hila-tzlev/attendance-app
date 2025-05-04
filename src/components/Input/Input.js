import React from 'react';
import './Input.css';

const Input = ({ placeholder, value, onChange, maxLength }) => {
  return (
    <input
      className="input"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      maxLength={maxLength}
    />
  );
};

export default Input;