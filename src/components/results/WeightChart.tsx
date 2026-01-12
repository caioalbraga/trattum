import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';
import { WeightProjection } from '@/types/assessment';
import { TrendingDown } from 'lucide-react';

interface WeightChartProps {
  data: WeightProjection[];
  currentWeight: number;
  targetWeight: number;
}

export function WeightChart({ data, currentWeight, targetWeight }: WeightChartProps) {
  const potentialLoss = currentWeight - targetWeight;
  const lastPoint = data[data.length - 1];

  return (
    <div className="bg-card rounded-2xl p-6 shadow-card">
      <div className="mb-6">
        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Potencial perda de peso
        </p>
        <div className="flex items-center gap-2 mt-2">
          <TrendingDown className="w-6 h-6 text-primary" />
          <span className="text-4xl sm:text-5xl font-bold text-primary">
            {potentialLoss}kg
          </span>
        </div>
      </div>

      <div className="h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(160, 45%, 35%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(160, 45%, 35%)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(160, 10%, 45%)', fontSize: 12 }}
            />
            <YAxis 
              domain={[targetWeight - 5, currentWeight + 5]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(160, 10%, 45%)', fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(0, 0%, 100%)',
                border: '1px solid hsl(160, 15%, 88%)',
                borderRadius: '8px',
                boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.08)',
              }}
              formatter={(value: number) => [`${value} kg`, 'Peso']}
            />
            <Area
              type="monotone"
              dataKey="weight"
              stroke="hsl(160, 45%, 35%)"
              strokeWidth={3}
              fill="url(#weightGradient)"
            />
            <ReferenceDot
              x={lastPoint?.month}
              y={lastPoint?.weight}
              r={6}
              fill="hsl(160, 45%, 35%)"
              stroke="white"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Target weight label */}
      <div className="flex justify-end -mt-4 mr-4">
        <div className="bg-foreground text-background px-3 py-1.5 rounded-lg text-sm font-semibold">
          {targetWeight}kg
        </div>
      </div>

      {/* Weight summary */}
      <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t">
        <div className="text-center">
          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Peso Atual
          </p>
          <p className="text-2xl font-bold text-foreground mt-1">{currentWeight}kg</p>
        </div>
        <div className="text-center">
          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Peso Potencial
          </p>
          <p className="text-2xl font-bold text-foreground mt-1">{targetWeight}kg</p>
        </div>
      </div>
    </div>
  );
}
