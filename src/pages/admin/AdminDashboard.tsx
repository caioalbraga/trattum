import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { MetricCard } from '@/components/admin/MetricCard';
import { PerformanceAreaChart } from '@/components/admin/PerformanceAreaChart';
import { QuizFunnelChart } from '@/components/admin/QuizFunnelChart';
import { CohortTable } from '@/components/admin/CohortTable';
import { supabase } from '@/integrations/supabase/client';
import { 
  DollarSign,
  TrendingUp, 
  Users, 
  Target,
  Activity,
  Loader2,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface Metrics {
  mrr: number;
  mrrChange: number;
  gmv: number;
  gmvChange: number;
  ticketMedio: number;
  taxaAprovacao: number;
  ltv: number;
  cac: number;
  ltvCacRatio: number;
  avaliacoesPendentes: number;
  pedidosHoje: number;
}

interface ChartData {
  date: string;
  revenue: number;
  orders: number;
}

interface FunnelStep {
  label: string;
  value: number;
  color: string;
}

interface CohortData {
  month: string;
  users: number;
  retention: number[];
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [funnelData, setFunnelData] = useState<FunnelStep[]>([]);
  const [cohortData, setCohortData] = useState<CohortData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    try {
      // Fetch orders for GMV and MRR
      const { data: pedidos, error: pedidosError } = await supabase
        .from('pedidos')
        .select('valor, created_at, status');

      if (pedidosError) throw pedidosError;

      // Fetch assessments for metrics
      const { data: avaliacoes } = await supabase
        .from('avaliacoes')
        .select('status, created_at, user_id');

      // Calculate metrics
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
      const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
      
      // This month orders
      const pedidosThisMonth = pedidos?.filter(p => {
        const date = new Date(p.created_at);
        return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
      }) || [];

      // Last month orders for comparison
      const pedidosLastMonth = pedidos?.filter(p => {
        const date = new Date(p.created_at);
        return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
      }) || [];

      const mrr = pedidosThisMonth.reduce((acc, p) => acc + Number(p.valor), 0);
      const mrrLastMonth = pedidosLastMonth.reduce((acc, p) => acc + Number(p.valor), 0);
      const mrrChange = mrrLastMonth > 0 ? ((mrr - mrrLastMonth) / mrrLastMonth) * 100 : 0;

      // GMV (all-time gross merchandise value)
      const gmv = pedidos?.reduce((acc, p) => acc + Number(p.valor), 0) || 0;
      const gmvChange = 12.5; // Placeholder for comparison

      const ticketMedio = pedidosThisMonth.length > 0 
        ? mrr / pedidosThisMonth.length 
        : 0;

      // Approval rate
      const totalAvaliacoes = avaliacoes?.length || 0;
      const aprovadas = avaliacoes?.filter(a => a.status === 'aprovado').length || 0;
      const taxaAprovacao = totalAvaliacoes > 0 
        ? (aprovadas / totalAvaliacoes) * 100 
        : 0;

      const avaliacoesPendentes = avaliacoes?.filter(a => a.status === 'pendente').length || 0;

      // Today's orders
      const today = now.toISOString().split('T')[0];
      const pedidosHoje = pedidos?.filter(p => p.created_at.startsWith(today)).length || 0;

      // LTV calculation (avg order * 6 month retention estimate)
      const avgOrderValue = pedidos && pedidos.length > 0
        ? pedidos.reduce((acc, p) => acc + Number(p.valor), 0) / pedidos.length
        : 0;
      const ltv = avgOrderValue * 6;

      // CAC (placeholder - would come from marketing spend / new customers)
      const uniqueCustomers = new Set(avaliacoes?.map(a => a.user_id)).size || 1;
      const cac = 150; // Placeholder CAC
      const ltvCacRatio = cac > 0 ? ltv / cac : 0;

      setMetrics({
        mrr,
        mrrChange,
        gmv,
        gmvChange,
        ticketMedio,
        taxaAprovacao,
        ltv,
        cac,
        ltvCacRatio,
        avaliacoesPendentes,
        pedidosHoje
      });

      // Generate chart data (last 30 days)
      const chartDataPoints: ChartData[] = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const displayDate = `${date.getDate()}/${date.getMonth() + 1}`;
        
        const dayOrders = pedidos?.filter(p => p.created_at.startsWith(dateStr)) || [];
        const dayRevenue = dayOrders.reduce((acc, p) => acc + Number(p.valor), 0);
        
        chartDataPoints.push({
          date: displayDate,
          revenue: dayRevenue,
          orders: dayOrders.length
        });
      }
      setChartData(chartDataPoints);

      // Quiz funnel data
      const funnelSteps: FunnelStep[] = [
        { label: 'Acessos', value: 1250, color: 'hsl(166, 29%, 14%)' },
        { label: 'Biometria', value: 980, color: 'hsl(166, 26%, 28%)' },
        { label: 'Histórico', value: 720, color: 'hsl(166, 22%, 38%)' },
        { label: 'Hábitos', value: 540, color: 'hsl(166, 18%, 50%)' },
        { label: 'Checkout', value: 320, color: 'hsl(166, 14%, 60%)' },
        { label: 'Conversão', value: 180, color: 'hsl(166, 45%, 35%)' },
      ];
      setFunnelData(funnelSteps);

      // Cohort retention data (sample)
      const cohorts: CohortData[] = [
        { month: 'Jan 2026', users: 245, retention: [100, 72, 58, 45, 38] },
        { month: 'Dez 2025', users: 312, retention: [100, 68, 52, 41] },
        { month: 'Nov 2025', users: 198, retention: [100, 65, 48] },
        { month: 'Out 2025', users: 276, retention: [100, 70] },
        { month: 'Set 2025', users: 189, retention: [100] },
      ];
      setCohortData(cohorts);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatCurrencyFull = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Métricas de performance e análise de negócio
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Date range selector */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50 border border-border/50">
              {['7d', '30d', '90d'].map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    dateRange === range
                      ? 'bg-background shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {range === '7d' ? '7 dias' : range === '30d' ? '30 dias' : '90 dias'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Primary KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="MRR"
            value={formatCurrency(metrics?.mrr || 0)}
            subtitle="Monthly Recurring Revenue"
            trend={{ value: metrics?.mrrChange || 0, label: 'vs mês anterior' }}
            icon={<DollarSign className="w-4 h-4" />}
            accentColor="forest"
            size="large"
          />
          
          <MetricCard
            title="GMV"
            value={formatCurrency(metrics?.gmv || 0)}
            subtitle="Gross Merchandise Value"
            trend={{ value: metrics?.gmvChange || 0, label: 'vs período anterior' }}
            icon={<TrendingUp className="w-4 h-4" />}
            accentColor="teal"
            size="large"
          />
          
          <MetricCard
            title="LTV / CAC"
            value={`${(metrics?.ltvCacRatio || 0).toFixed(1)}x`}
            subtitle={`LTV: ${formatCurrencyFull(metrics?.ltv || 0)}`}
            icon={<Target className="w-4 h-4" />}
            accentColor="coral"
            size="large"
          />
          
          <MetricCard
            title="Ticket Médio"
            value={formatCurrencyFull(metrics?.ticketMedio || 0)}
            subtitle="Por pedido"
            icon={<Activity className="w-4 h-4" />}
            accentColor="slate"
            size="large"
          />
        </div>

        {/* Secondary KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MetricCard
            title="CAC"
            value={formatCurrencyFull(metrics?.cac || 0)}
            subtitle="Customer Acquisition Cost"
            accentColor="amber"
          />
          
          <MetricCard
            title="Taxa Aprovação"
            value={`${(metrics?.taxaAprovacao || 0).toFixed(1)}%`}
            subtitle="Avaliações aprovadas"
            accentColor="teal"
          />
          
          <MetricCard
            title="Pendentes"
            value={String(metrics?.avaliacoesPendentes || 0)}
            subtitle="Avaliações aguardando"
            accentColor="coral"
          />
          
          <MetricCard
            title="Pedidos Hoje"
            value={String(metrics?.pedidosHoje || 0)}
            subtitle="Novos pedidos"
            accentColor="forest"
          />
        </div>

        {/* Quick Actions */}
        {(metrics?.avaliacoesPendentes || 0) > 0 && (
          <div className="card-glass p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {metrics?.avaliacoesPendentes} avaliações aguardando triagem
                </p>
                <p className="text-xs text-muted-foreground">
                  Pacientes aguardando aprovação clínica
                </p>
              </div>
            </div>
            <Link to="/trattum-admin/inbox">
              <Button variant="outline" size="sm" className="gap-2">
                Ver Inbox
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        )}

        {/* Charts Row */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Performance Chart - Takes 2 columns */}
          <div className="lg:col-span-2 card-glass p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-serif text-lg font-semibold">Performance</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Receita e volume de pedidos
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                <Calendar className="w-3 h-3 mr-1" />
                Últimos 30 dias
              </Badge>
            </div>
            <div className="h-[320px]">
              <PerformanceAreaChart data={chartData} showBrush={true} />
            </div>
          </div>

          {/* Quiz Funnel */}
          <div className="card-glass p-6">
            <div className="mb-6">
              <h2 className="font-serif text-lg font-semibold">Quiz Throughput</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Funil de conversão por etapa
              </p>
            </div>
            <QuizFunnelChart data={funnelData} />
          </div>
        </div>

        {/* Cohort Analysis */}
        <div className="card-glass p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-serif text-lg font-semibold">Cohort Retention</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Retenção mensal de usuários por coorte
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              <Users className="w-3 h-3 mr-1" />
              Últimos 5 meses
            </Badge>
          </div>
          <CohortTable data={cohortData} />
        </div>
      </div>
    </AdminLayout>
  );
}
