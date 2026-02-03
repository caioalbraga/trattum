import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  TrendingUp, 
  Users, 
  CheckCircle, 
  DollarSign,
  Activity,
  Loader2
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

interface Metrics {
  mrr: number;
  ticketMedio: number;
  taxaAprovacao: number;
  ltv: number;
  avaliacoesPendentes: number;
  pedidosHoje: number;
}

interface FunnelData {
  data: string;
  acessos: number;
  vendas: number;
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [funnelData, setFunnelData] = useState<FunnelData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch orders for MRR and Ticket Médio
      const { data: pedidos, error: pedidosError } = await supabase
        .from('pedidos')
        .select('valor, created_at, status');

      if (pedidosError) throw pedidosError;

      // Fetch assessments for approval rate
      const { data: avaliacoes, error: avaliacoesError } = await supabase
        .from('avaliacoes')
        .select('status, created_at');

      // Calculate metrics
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      
      const pedidosThisMonth = pedidos?.filter(p => {
        const date = new Date(p.created_at);
        return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
      }) || [];

      const mrr = pedidosThisMonth.reduce((acc, p) => acc + Number(p.valor), 0);
      const ticketMedio = pedidosThisMonth.length > 0 
        ? mrr / pedidosThisMonth.length 
        : 0;

      const totalAvaliacoes = avaliacoes?.length || 0;
      const aprovadas = avaliacoes?.filter(a => a.status === 'aprovado').length || 0;
      const taxaAprovacao = totalAvaliacoes > 0 
        ? (aprovadas / totalAvaliacoes) * 100 
        : 0;

      const avaliacoesPendentes = avaliacoes?.filter(a => a.status === 'pendente').length || 0;

      const today = now.toISOString().split('T')[0];
      const pedidosHoje = pedidos?.filter(p => 
        p.created_at.startsWith(today)
      ).length || 0;

      // LTV estimation (average order value * estimated repeat purchases)
      const avgOrderValue = pedidos && pedidos.length > 0
        ? pedidos.reduce((acc, p) => acc + Number(p.valor), 0) / pedidos.length
        : 0;
      const ltv = avgOrderValue * 6; // Assuming 6 months average retention

      setMetrics({
        mrr,
        ticketMedio,
        taxaAprovacao,
        ltv,
        avaliacoesPendentes,
        pedidosHoje
      });

      // Fetch funnel metrics for chart
      const { data: metricas } = await supabase
        .from('metricas_funil')
        .select('*')
        .order('data', { ascending: true })
        .limit(30);

      if (metricas && metricas.length > 0) {
        // Group by date
        const grouped = metricas.reduce((acc: Record<string, FunnelData>, m) => {
          if (!acc[m.data]) {
            acc[m.data] = { data: m.data, acessos: 0, vendas: 0 };
          }
          if (m.tipo === 'acesso_quiz') acc[m.data].acessos += 1;
          if (m.tipo === 'venda') acc[m.data].vendas += 1;
          return acc;
        }, {});
        setFunnelData(Object.values(grouped));
      } else {
        // Sample data for visualization
        setFunnelData([
          { data: '15/01', acessos: 45, vendas: 12 },
          { data: '16/01', acessos: 52, vendas: 15 },
          { data: '17/01', acessos: 38, vendas: 8 },
          { data: '18/01', acessos: 61, vendas: 18 },
          { data: '19/01', acessos: 55, vendas: 14 },
          { data: '20/01', acessos: 48, vendas: 11 },
        ]);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
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
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-serif text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral das métricas e performance
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                MRR (Receita Mensal)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(metrics?.mrr || 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">Este mês</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Ticket Médio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(metrics?.ticketMedio || 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">Por pedido</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Taxa de Aprovação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{metrics?.taxaAprovacao.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground mt-1">Avaliações aprovadas</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                LTV Estimado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(metrics?.ltv || 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">Lifetime Value médio</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Avaliações Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">{metrics?.avaliacoesPendentes || 0}</p>
                {(metrics?.avaliacoesPendentes || 0) > 0 && (
                  <Badge variant="destructive" className="text-xs">Ação necessária</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Aguardando triagem</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-teal-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Pedidos Hoje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{metrics?.pedidosHoje || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Novos pedidos</p>
            </CardContent>
          </Card>
        </div>

        {/* Funnel Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Funil de Conversão</CardTitle>
            <p className="text-sm text-muted-foreground">
              Comparativo: Acessos ao Quiz vs Vendas Finalizadas
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={funnelData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="data" 
                    className="text-xs" 
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="acessos" 
                    name="Acessos ao Quiz"
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="vendas" 
                    name="Vendas"
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
