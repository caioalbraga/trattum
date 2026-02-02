import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface FunnelStep {
  label: string;
  value: number;
  color: string;
}

interface QuizFunnelChartProps {
  data: FunnelStep[];
  className?: string;
}

export function QuizFunnelChart({ data, className }: QuizFunnelChartProps) {
  const maxValue = useMemo(() => Math.max(...data.map(d => d.value)), [data]);

  const getDropRate = (index: number) => {
    if (index === 0) return null;
    const prevValue = data[index - 1].value;
    const currValue = data[index].value;
    if (prevValue === 0) return 0;
    return ((prevValue - currValue) / prevValue * 100).toFixed(1);
  };

  return (
    <div className={cn('space-y-3', className)}>
      {data.map((step, index) => {
        const width = maxValue > 0 ? (step.value / maxValue) * 100 : 0;
        const dropRate = getDropRate(index);

        return (
          <div key={step.label} className="relative">
            {/* Drop indicator */}
            {dropRate !== null && (
              <div className="absolute -top-2 left-0 right-0 flex items-center justify-center">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <svg className="w-3 h-3 rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12l7-7 7 7" />
                  </svg>
                  <span className="text-red-500 font-medium">-{dropRate}%</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              {/* Label */}
              <div className="w-24 text-right">
                <span className="text-xs font-medium text-muted-foreground">
                  {step.label}
                </span>
              </div>

              {/* Bar */}
              <div className="flex-1 h-10 bg-muted/30 rounded-lg overflow-hidden relative">
                <div
                  className="h-full rounded-lg transition-all duration-500 ease-out flex items-center justify-end px-3"
                  style={{
                    width: `${width}%`,
                    backgroundColor: step.color,
                  }}
                >
                  <span className="text-xs font-mono-numbers font-semibold text-white drop-shadow-sm">
                    {step.value.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>

              {/* Percentage of total */}
              <div className="w-14 text-right">
                <span className="text-xs font-mono-numbers text-muted-foreground">
                  {((step.value / (data[0]?.value || 1)) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 pt-4 border-t border-border/50">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-3 h-3 rounded bg-[hsl(166,29%,14%)]" />
          <span>Conversão total:</span>
          <span className="font-mono-numbers font-semibold text-foreground">
            {data.length >= 2 
              ? ((data[data.length - 1].value / (data[0]?.value || 1)) * 100).toFixed(1)
              : 0}%
          </span>
        </div>
      </div>
    </div>
  );
}
