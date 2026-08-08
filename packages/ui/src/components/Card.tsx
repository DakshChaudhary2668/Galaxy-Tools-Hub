import React, { HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  bordered?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, bordered = true, className = '', ...props }) => {
  return (
    <div className={`card ${bordered ? 'card-bordered' : ''} ${className}`} {...props}>
      {children}
    </div>
  );
};
