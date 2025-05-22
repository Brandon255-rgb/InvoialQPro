import React from 'react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  isLoading?: boolean;
}

export function AuthButton({ children, className, isLoading, ...props }: AuthButtonProps) {
  return (
    <Button
      className={cn(
        "w-full px-6 py-3 text-base font-medium text-white rounded-xl",
        "bg-gradient-to-r from-orange-500 via-orange-400 to-orange-300",
        "hover:from-orange-600 hover:via-orange-500 hover:to-orange-400",
        "focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2",
        "transition-all duration-200 shadow-lg",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      style={{
        boxShadow: '0 4px 14px 0 rgba(255, 137, 6, 0.39), 0 1px 0 0 rgba(255, 255, 255, 0.1) inset',
      }}
      disabled={isLoading}
      {...props}
    >
      {children}
    </Button>
  );
} 