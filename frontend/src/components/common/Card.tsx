import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  // FIX: Updated onClick prop to accept a MouseEvent to match standard DOM event handlers.
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  // FIX: Add style prop to allow passing inline styles for animations.
  style?: React.CSSProperties;
}

const Card: React.FC<CardProps> = ({ children, className = '', onClick, style }) => {
  const interactiveClasses = onClick
    ? 'hover:shadow-xl hover:dark:shadow-brand-primary/20 dark:hover:bg-slate-800/50 cursor-pointer hover:-translate-y-1'
    : '';
  return (
    <div
      onClick={onClick}
      style={style}
      className={`bg-white dark:bg-brand-dark p-6 rounded-lg shadow-md dark:shadow-lg border border-brand-border-light dark:border-brand-border-dark transition-all duration-300 ${interactiveClasses} ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;

