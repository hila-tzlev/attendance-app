import React, { useState } from "react";
import "./Input.css";

const Input = ({ type, placeholder, value, onChange, maxLength }) => {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";
  const currentType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="input-container">
      <input
        className="input"
        type={currentType}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        maxLength={maxLength}
      />
      {isPassword && (
        <span
          className="password-toggle"
          onClick={() => setShowPassword(!showPassword)}
        >
          <i className={showPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"}></i>
        </span>
      )}
    </div>
  );
};

export default Input;
