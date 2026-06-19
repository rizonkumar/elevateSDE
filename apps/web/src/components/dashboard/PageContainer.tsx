import * as React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <div
      className={`mx-auto w-full max-w-(--page-max-width) px-4 py-8 sm:px-6 sm:py-10 lg:px-8 ${className}`.trim()}
    >
      {children}
    </div>
  );
}
