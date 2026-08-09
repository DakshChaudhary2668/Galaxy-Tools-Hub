import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

// TODO: implement styling — label-caps label, gold focus ring, error state
export function Input({ label, error, hint, id, ...props }: InputProps) {
  return (
    <div>
      {label && <label htmlFor={id}>{label}</label>}
      <input id={id} aria-describedby={error ? `${id}-error` : undefined} {...props} />
      {error && <span id={`${id}-error`} role="alert">{error}</span>}
      {hint && !error && <span>{hint}</span>}
    </div>
  );
}
