import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { MetricCard } from '@/components/admin/dashboard/MetricCard';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  ClipboardList,
  CreditCard,
  CalendarClock,
  BarChart3
} from 'lucide-react';

interface Metrics {
  mrr: number;
  ticketMedio: number;
  pacientesAtivos: number;
  avaliacoesPendentes: number;
  conversao: number;
  aguardandoPagamento: number;
  renovacoesProximas: number;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [
        { data: pedidos },
        { count: pacientesAtivos },
        { count: avaliacoesPendentes },
        { data: avaliacoesAll },
        { count: aguardandoPagamento },
        { data: renovacoes },
      ] = await Promise.all([
        supabase.from('pedidos').select('valor, created_at, status'),
        supabase.from('tratamentos').select('*', { count: 'exact', head: true })
          .in('status', ['em_andamento', 'entregue']),
        supabase.from('avaliacoes').select('*', { count: 'exact', head: true })
          .eq('status', 'pendente'),
        supabase.from('avaliacoes').select('status'),
        supabase.from('tratamentos').select('*', { count: 'exact', head: true })
          .eq('status', 'aprovado'),
        supabase.from('tratamentos').select('data_proxima_renovacao')
          .not('data_proxima_renovacao', 'is', null)
          .in('status', ['em_andamento', 'entregue']),
      ]);

      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      
      const pedidosThisMonth = pedidos?.filter(p => {
        const date = new Date(p.created_at);
        return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
      }) || [];

      const mrr = pedidosThisMonth.reduce((acc, p) => acc + Number(p.valor), 0);
      const ticketMedio = pedidosThisMonth.length > 0 ? mrr / pedidosThisMonth.length : 0;

      // Conversão: approved / total submitted
      const totalAvaliacoes = avaliacoesAll?.length || 0;
      const aprovadas = avaliacoesAll?.filter(a => a.status === 'aprovado').length || 0;
      const conversao = totalAvaliacoes > 0 ? Math.round((aprovadas / totalAvaliacoes) * 100) : 0;

      // Renovações próximas (next 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const renovacoesProximas = renovacoes?.filter(r => {
        if (!r.data_proxima_renovacao) return false;
        const d = new Date(r.data_proxima_renovacao);
        return d >= now && d <= thirtyDaysFromNow;
      }).length || 0;

      setMetrics({
        mrr,
        ticketMedio,
        pacientesAtivos: pacientesAtivos || 0,
        avaliacoesPendentes: avaliacoesPendentes || 0,
        conversao,
        aguardandoPagamento: aguardandoPagamento || 0,
        renovacoesProximas,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar os dados do dashboard.'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <header>
          <h1 className="font-serif text-2xl font-semibold text-foreground">
            Visão Geral
          </h1>
          <p className="text-muted-foreground mt-1">
            Métricas financeiras e operacionais da clínica.
          </p>
        </header>

        {/* Financial KPIs */}
        <section>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">
            Financeiro
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-card border border-border/60 rounded-xl p-6">
                  <Skeleton className="h-4 w-24 mb-3" />
                  <Skeleton className="h-8 w-20" />
                </div>
              ))
            ) : (
              <>
                <MetricCard
                  title="Faturamento Mensal"
                  value={formatCurrency(metrics?.mrr || 0)}
                  subtitle="Este mês"
                  icon={<DollarSign className="h-5 w-5" />}
                />
                <MetricCard
                  title="Ticket Médio"
                  value={formatCurrency(metrics?.ticketMedio || 0)}
                  subtitle="Por pedido"
                  icon={<TrendingUp className="h-5 w-5" />}
                />
                <MetricCard
                  title="Conversão"
                  value={`${metrics?.conversao || 0}%`}
                  subtitle="Anamnese → Aprovação"
                  icon={<BarChart3 className="h-5 w-5" />}
                />
              </>
            )}
          </div>
        </section>

        {/* Operational KPIs */}
        <section>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">
            Operacional
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-card border border-border/60 rounded-xl p-6">
                  <Skeleton className="h-4 w-24 mb-3" />
                  <Skeleton className="h-8 w-20" />
                </div>
              ))
            ) : (
              <>
                <MetricCard
                  title="Pacientes Ativos"
                  value={metrics?.pacientesAtivos || 0}
                  subtitle="Com tratamento em curso"
                  icon={<Users className="h-5 w-5" />}
                />
                <div 
                  className="cursor-pointer" 
                  onClick={() => navigate('/trattum-admin/atendimento')}
                >
                  <MetricCard
                    title="Aguardando Triagem"
                    value={metrics?.avaliacoesPendentes || 0}
                    subtitle="Ir para Atendimento →"
                    icon={<ClipboardList className="h-5 w-5" />}
                    alert={(metrics?.avaliacoesPendentes || 0) > 0}
                  />
                </div>
                <MetricCard
                  title="Aguardando Pagamento"
                  value={metrics?.aguardandoPagamento || 0}
                  subtitle="Aprovados, sem pagamento"
                  icon={<CreditCard className="h-5 w-5" />}
                  alert={(metrics?.aguardandoPagamento || 0) > 0}
                />
                <MetricCard
                  title="Renovações Próximas"
                  value={metrics?.renovacoesProximas || 0}
                  subtitle="Nos próximos 30 dias"
                  icon={<CalendarClock className="h-5 w-5" />}
                />
              </>
            )}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
