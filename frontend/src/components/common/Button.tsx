
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: any;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', size, ...props }) => {
  const baseClasses = 'px-6 py-2 rounded-md font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-brand-darkest';

  const variantClasses = {
    primary: 'bg-brand-primary text-white hover:bg-brand-primary-hover focus:ring-brand-primary',
    secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-400 dark:bg-brand-dark dark:text-gray-100 dark:hover:bg-slate-700 dark:focus:ring-brand-dark',
    outline: 'bg-transparent border border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white focus:ring-brand-primary',
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;