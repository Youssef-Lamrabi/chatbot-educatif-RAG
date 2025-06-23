import React from 'react';

const Card = ({ children, className = '' }) => {
  return (
    <div className={`bg-white shadow-lg rounded-xl p-6 sm:p-8 ${className}`}>
      {children}
    </div>
  );
};

export default Card;