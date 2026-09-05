import React from 'react';
import './Badge.css';

export default function Badge({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'success' | 'warning' | 'outline'
  size = 'md', // 'sm' | 'md'
  icon: Icon,
  className = '',
}) {
  return (
    <span className={`gym-badge gym-badge-${variant} gym-badge-${size} ${className}`}>
      {Icon && <Icon size={size === 'sm' ? 12 : 14} className="gym-badge-icon" />}
      {children}
    </span>
  );
}
