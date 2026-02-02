import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush,
  Legend,
} from 'recharts';

interface ChartData {
  date: string;
  revenue: number;
  orders: number;
}

interface PerformanceAreaChartProps {
  data: ChartData[];
  showBrush?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;

  return (
    <div className="card-glass p-3 shadow-lg border border-black/5">
      <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <div 
            className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-muted-foreground">{entry.name}:</span>
          <span className="text-xs font-mono-numbers font-semibold">
            {entry.name === 'Receita' 
              ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entry.value)
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export function PerformanceAreaChart({ data, showBrush = true }: PerformanceAreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(166, 35%, 40%)" stopOpacity={0.4} />
            <stop offset="95%" stopColor="hsl(166, 35%, 40%)" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(166, 18%, 50%)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(166, 18%, 50%)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        
        <CartesianGrid 
          strokeDasharray="3 3" 
          stroke="hsl(var(--border))" 
          strokeOpacity={0.5}
          vertical={false}
        />
        
        <XAxis
          dataKey="date"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          dy={10}
        />
        
        <YAxis
          yAxisId="revenue"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
          width={55}
        />
        
        <YAxis
          yAxisId="orders"
          orientation="right"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          width={40}
        />
        
        <Tooltip content={<CustomTooltip />} />
        
        <Legend
          verticalAlign="top"
          height={36}
          iconType="circle"
          iconSize={8}
          formatter={(value) => (
            <span className="text-xs text-muted-foreground">{value}</span>
          )}
        />

        <Area
          yAxisId="revenue"
          type="monotone"
          dataKey="revenue"
          name="Receita"
          stroke="hsl(166, 35%, 40%)"
          strokeWidth={2}
          fill="url(#revenueGradient)"
          dot={false}
          activeDot={{ r: 4, fill: 'hsl(166, 35%, 40%)', strokeWidth: 0 }}
        />
        
        <Area
          yAxisId="orders"
          type="monotone"
          dataKey="orders"
          name="Pedidos"
          stroke="hsl(166, 18%, 50%)"
          strokeWidth={2}
          fill="url(#ordersGradient)"
          dot={false}
          activeDot={{ r: 4, fill: 'hsl(166, 18%, 50%)', strokeWidth: 0 }}
        />

        {showBrush && (
          <Brush
            dataKey="date"
            height={30}
            stroke="hsl(var(--border))"
            fill="hsl(var(--muted))"
            tickFormatter={() => ''}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}
