import * as React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'btn-primary shadow-sm',
  secondary: 'btn-secondary',
  danger: 'bg-rose-500 text-white shadow-sm hover:bg-rose-600 disabled:opacity-60',
};

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const baseStyle =
    'px-5 py-2.5 rounded-full font-semibold transition-all focus:outline-none text-sm cursor-pointer select-none active:scale-[0.98]';
  return <button className={`${baseStyle} ${variantClasses[variant]} ${className}`} {...props} />;
}
