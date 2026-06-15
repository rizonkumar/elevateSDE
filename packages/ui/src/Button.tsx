import * as React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const baseStyle =
    'px-5 py-2.5 rounded-full font-semibold transition-all focus:outline-none text-sm cursor-pointer select-none active:scale-[0.98]';
  const variantStyle = variant === 'primary' ? 'btn-primary shadow-sm' : 'btn-secondary';
  return <button className={`${baseStyle} ${variantStyle} ${className}`} {...props} />;
}
