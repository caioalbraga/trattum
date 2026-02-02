import { cn } from '@/lib/utils';

interface CohortData {
  month: string;
  users: number;
  retention: number[]; // Percentages for each subsequent month
}

interface CohortTableProps {
  data: CohortData[];
  className?: string;
}

const getRetentionColor = (value: number) => {
  if (value >= 80) return 'bg-emerald-500/80 text-white';
  if (value >= 60) return 'bg-emerald-500/50 text-foreground';
  if (value >= 40) return 'bg-amber-500/50 text-foreground';
  if (value >= 20) return 'bg-amber-500/30 text-foreground';
  return 'bg-red-500/20 text-foreground';
};

export function CohortTable({ data, className }: CohortTableProps) {
  const maxMonths = Math.max(...data.map(d => d.retention.length));
  const monthHeaders = Array.from({ length: maxMonths }, (_, i) => `M${i + 1}`);

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border/50">
            <th className="text-left py-2 px-3 font-medium text-muted-foreground">
              Cohort
            </th>
            <th className="text-right py-2 px-3 font-medium text-muted-foreground">
              Usuários
            </th>
            {monthHeaders.map((header) => (
              <th key={header} className="text-center py-2 px-2 font-medium text-muted-foreground w-12">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((cohort, rowIndex) => (
            <tr key={cohort.month} className="border-b border-border/30">
              <td className="py-2 px-3 font-medium">{cohort.month}</td>
              <td className="py-2 px-3 text-right font-mono-numbers">
                {cohort.users.toLocaleString('pt-BR')}
              </td>
              {monthHeaders.map((_, colIndex) => {
                const value = cohort.retention[colIndex];
                if (value === undefined) {
                  return <td key={colIndex} className="py-2 px-2" />;
                }
                return (
                  <td key={colIndex} className="py-1.5 px-1">
                    <div
                      className={cn(
                        'rounded text-center py-1 font-mono-numbers font-medium text-[10px]',
                        getRetentionColor(value)
                      )}
                    >
                      {value}%
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Legend */}
      <div className="flex items-center justify-end gap-3 mt-4 text-[10px] text-muted-foreground">
        <span>Retenção:</span>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-500/20" />
          <span>&lt;20%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-amber-500/30" />
          <span>20-40%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-amber-500/50" />
          <span>40-60%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-emerald-500/50" />
          <span>60-80%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-emerald-500/80" />
          <span>&gt;80%</span>
        </div>
      </div>
    </div>
  );
}
