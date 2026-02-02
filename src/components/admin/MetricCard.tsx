import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: {
    value: number;
    label: string;
  };
  icon?: ReactNode;
  accentColor?: 'forest' | 'teal' | 'coral' | 'amber' | 'slate';
  size?: 'default' | 'large';
}

const accentColors = {
  forest: 'bg-[hsl(166,29%,14%,0.1)] text-[hsl(166,29%,14%)]',
  teal: 'bg-[hsl(166,45%,35%,0.1)] text-[hsl(166,45%,35%)]',
  coral: 'bg-[hsl(12,76%,72%,0.15)] text-[hsl(12,76%,60%)]',
  amber: 'bg-amber-500/10 text-amber-600',
  slate: 'bg-[hsl(166,18%,50%,0.1)] text-[hsl(166,18%,50%)]',
};

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  accentColor = 'forest',
  size = 'default',
}: MetricCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return <TrendingUp className="w-3 h-3" />;
    if (trend.value < 0) return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const getTrendColor = () => {
    if (!trend) return '';
    if (trend.value > 0) return 'text-emerald-600 dark:text-emerald-400';
    if (trend.value < 0) return 'text-red-500 dark:text-red-400';
    return 'text-muted-foreground';
  };

  return (
    <div className="metric-card group hover:shadow-md transition-shadow duration-300">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        {icon && (
          <div className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center',
            accentColors[accentColor]
          )}>
            {icon}
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <p className={cn(
          'font-mono-numbers font-semibold tracking-tight',
          size === 'large' ? 'text-3xl' : 'text-2xl'
        )}>
          {value}
        </p>
        
        <div className="flex items-center gap-2">
          {trend && (
            <span className={cn(
              'flex items-center gap-0.5 text-xs font-medium',
              getTrendColor()
            )}>
              {getTrendIcon()}
              {Math.abs(trend.value)}%
            </span>
          )}
          {subtitle && (
            <span className="text-xs text-muted-foreground">
              {subtitle}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
