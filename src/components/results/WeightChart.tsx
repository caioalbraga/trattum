import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot, CartesianGrid } from 'recharts';
import { WeightProjection } from '@/types/assessment';
import { TrendingDown, Target } from 'lucide-react';

interface WeightChartProps {
  data: WeightProjection[];
  currentWeight: number;
  targetWeight: number;
}

export function WeightChart({ data, currentWeight, targetWeight }: WeightChartProps) {
  const potentialLoss = currentWeight - targetWeight;
  const potentialLossPercent = Math.round((potentialLoss / currentWeight) * 100);
  const lastPoint = data[data.length - 1];
  const firstPoint = data[0];

  return (
    <div className="bg-card rounded-2xl p-6 sm:p-8 shadow-card border border-border/40">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-2">
            Potencial perda de peso
          </p>
          <div className="flex items-baseline gap-3">
            <span className="text-5xl sm:text-6xl font-serif font-medium text-foreground">
              {potentialLoss}kg
            </span>
            <span className="text-lg text-teal font-medium">
              -{potentialLossPercent}%
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-teal/10 text-teal px-4 py-2 rounded-full">
          <TrendingDown className="w-4 h-4" />
          <span className="text-sm font-medium">Em 6 meses</span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 sm:h-72 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(166, 45%, 35%)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="hsl(166, 45%, 35%)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false} 
              stroke="hsl(166, 15%, 88%)"
            />
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(166, 15%, 45%)', fontSize: 12, fontWeight: 500 }}
              dy={10}
            />
            <YAxis 
              domain={[targetWeight - 10, currentWeight + 5]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(166, 15%, 45%)', fontSize: 12 }}
              dx={-10}
              tickFormatter={(value) => `${value}kg`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(0, 0%, 100%)',
                border: '1px solid hsl(166, 15%, 88%)',
                borderRadius: '12px',
                boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.1)',
                padding: '12px 16px',
              }}
              formatter={(value: number) => [`${value} kg`, 'Peso projetado']}
              labelStyle={{ fontWeight: 600, marginBottom: 4 }}
            />
            <Area
              type="monotone"
              dataKey="weight"
              stroke="hsl(166, 45%, 35%)"
              strokeWidth={3}
              fill="url(#weightGradient)"
            />
            {/* Starting point */}
            <ReferenceDot
              x={firstPoint?.month}
              y={firstPoint?.weight}
              r={8}
              fill="hsl(166, 45%, 35%)"
              stroke="white"
              strokeWidth={3}
            />
            {/* End point */}
            <ReferenceDot
              x={lastPoint?.month}
              y={lastPoint?.weight}
              r={8}
              fill="hsl(166, 45%, 35%)"
              stroke="white"
              strokeWidth={3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Target weight label */}
      <div className="flex justify-end mt-2">
        <div className="bg-foreground text-background px-4 py-2 rounded-lg inline-flex items-center gap-2">
          <Target className="w-4 h-4" />
          <span className="text-sm font-semibold">{targetWeight}kg</span>
        </div>
      </div>

      {/* Weight summary */}
      <div className="grid grid-cols-2 gap-6 mt-8 pt-6 border-t border-border/60">
        <div className="text-center">
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-1">
            Peso Atual
          </p>
          <p className="text-3xl font-serif font-medium text-foreground">{currentWeight}kg</p>
        </div>
        <div className="text-center">
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-1">
            Peso Potencial
          </p>
          <p className="text-3xl font-serif font-medium text-teal">{targetWeight}kg</p>
        </div>
      </div>
    </div>
  );
}
