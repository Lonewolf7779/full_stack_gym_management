import React from 'react';
import './Button.css';

export default function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost'
  size = 'md', // 'sm' | 'md' | 'lg'
  fullWidth = false,
  className = '',
  icon: Icon,
  iconPosition = 'right',
  onClick,
  disabled = false,
  type = 'button',
  ...props
}) {
  const rootClass = [
    'gym-btn',
    `gym-btn-${variant}`,
    `gym-btn-${size}`,
    fullWidth ? 'gym-btn-full' : '',
    disabled ? 'gym-btn-disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={rootClass}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {Icon && iconPosition === 'left' && <Icon className="gym-btn-icon icon-left" size={size === 'sm' ? 16 : size === 'lg' ? 22 : 18} />}
      <span className="gym-btn-text">{children}</span>
      {Icon && iconPosition === 'right' && <Icon className="gym-btn-icon icon-right" size={size === 'sm' ? 16 : size === 'lg' ? 22 : 18} />}
    </button>
  );
}
