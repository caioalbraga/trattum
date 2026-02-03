import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  alert?: boolean;
  className?: string;
}

export function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon,
  alert = false,
  className 
}: MetricCardProps) {
  return (
    <div 
      className={cn(
        "bg-card border border-border/60 rounded-xl p-6",
        "transition-colors duration-200",
        alert && "border-amber-300 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-700",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
            {title}
          </p>
          <p className={cn(
            "text-3xl font-semibold tracking-tight font-sans",
            alert ? "text-amber-700 dark:text-amber-400" : "text-foreground"
          )}>
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
        {icon && (
          <div className={cn(
            "p-2.5 rounded-lg",
            alert 
              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400" 
              : "bg-secondary text-muted-foreground"
          )}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
