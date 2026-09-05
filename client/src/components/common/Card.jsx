import React from 'react';
import './Card.css';

export default function Card({
  children,
  className = '',
  hoverEffect = true,
  glow = false,
  elevated = false,
  padding = 'normal', // 'none' | 'sm' | 'normal' | 'lg'
  ...props
}) {
  const cardClasses = [
    'gym-card',
    hoverEffect ? 'gym-card-hover' : '',
    glow ? 'gym-card-glow' : '',
    elevated ? 'gym-card-elevated' : '',
    `gym-card-pad-${padding}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cardClasses} {...props}>
      {children}
    </div>
  );
}
