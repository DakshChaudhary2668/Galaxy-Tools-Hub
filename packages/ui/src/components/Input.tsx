import React, { InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="input-wrapper">
      {label && <label className="input-label">{label}</label>}
      <input className={`input-field ${error ? 'input-error' : ''} ${className}`} {...props} />
      {error && <span className="input-error-msg">{error}</span>}
    </div>
  );
};
