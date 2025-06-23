import React from 'react';

const Spinner = ({ size = 'md', color = 'border-blue-500', className = '' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-4',
    lg: 'w-12 h-12 border-4',
  };
  return (
    <div className={`animate-spin rounded-full ${sizeClasses[size]} ${color} border-t-transparent ${className}`}></div>
  );
};

export default Spinner;