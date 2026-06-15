import * as React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const baseStyle = 'px-4 py-2 rounded font-medium transition-colors focus:outline-none';
  const variantStyle =
    variant === 'primary'
      ? 'bg-blue-600 text-white hover:bg-blue-700'
      : 'bg-zinc-200 text-zinc-800 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700';

  return (
    <button
      className={`${baseStyle} ${variantStyle} ${className}`}
      {...props}
    />
  );
}
