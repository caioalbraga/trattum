import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { MetricCard } from '@/components/admin/dashboard/MetricCard';
import { EvaluationsTable, type Evaluation } from '@/components/admin/dashboard/EvaluationsTable';
import { ClinicalDossier } from '@/components/admin/dashboard/ClinicalDossier';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  ClipboardList
} from 'lucide-react';

interface Metrics {
  mrr: number;
  ticketMedio: number;
  pacientesAtivos: number;
  avaliacoesPendentes: number;
}

// Helper to decrypt patient name
async function decryptName(encryptedName: string | null): Promise<string> {
  if (!encryptedName) return 'Nome não disponível';
  
  try {
    const { data, error } = await supabase.functions.invoke('decrypt-data', {
      body: { data: encryptedName, field: 'nome' }
    });
    
    if (error || !data?.decrypted) {
      return encryptedName;
    }
    return data.decrypted;
  } catch {
    return encryptedName;
  }
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);
  const [slideOverOpen, setSlideOverOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch orders for MRR and Ticket Médio
      const { data: pedidos } = await supabase
        .from('pedidos')
        .select('valor, created_at, status');

      // Fetch assessments
      const { data: avaliacoes } = await supabase
        .from('avaliacoes')
        .select('id, user_id, status, imc, created_at, respostas')
        .order('created_at', { ascending: false })
        .limit(20);

      // Fetch active treatments count
      const { count: tratamentosAtivos } = await supabase
        .from('tratamentos')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ativo');

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

      const avaliacoesPendentes = avaliacoes?.filter(a => a.status === 'pendente').length || 0;

      setMetrics({
        mrr,
        ticketMedio,
        pacientesAtivos: tratamentosAtivos || 0,
        avaliacoesPendentes
      });

      // Fetch patient names for evaluations
      if (avaliacoes && avaliacoes.length > 0) {
        const userIds = [...new Set(avaliacoes.map(a => a.user_id))];
        
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, nome')
          .in('user_id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p.nome]) || []);

        // Decrypt names
        const evaluationsWithNames = await Promise.all(
          avaliacoes.map(async (a) => {
            const encryptedName = profileMap.get(a.user_id) || null;
            const decryptedName = await decryptName(encryptedName);
            return {
              id: a.id,
              patient_name: decryptedName,
              imc: a.imc,
              status: a.status,
              created_at: a.created_at,
              respostas: a.respostas as Record<string, unknown>
            };
          })
        );

        setEvaluations(evaluationsWithNames);
      }
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

  const handleSelectEvaluation = (evaluation: Evaluation) => {
    setSelectedEvaluation(evaluation);
    setSlideOverOpen(true);
  };

  const handleUpdateStatus = async (id: string, newStatus: string, _note?: string) => {
    try {
      const { error } = await supabase
        .from('avaliacoes')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Status atualizado',
        description: `Avaliação marcada como ${newStatus}.`
      });

      // Update local state
      setEvaluations(prev => 
        prev.map(e => e.id === id ? { ...e, status: newStatus } : e)
      );
      setSelectedEvaluation(prev => 
        prev?.id === id ? { ...prev, status: newStatus } : prev
      );

      // Update pending count
      if (metrics) {
        const newPendingCount = evaluations.filter(e => 
          e.id === id ? newStatus === 'pendente' : e.status === 'pendente'
        ).length;
        setMetrics({ ...metrics, avaliacoesPendentes: newPendingCount });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar',
        description: 'Não foi possível atualizar o status.'
      });
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
        {/* Header */}
        <header>
          <h1 className="font-serif text-2xl font-semibold text-foreground">
            Visão Geral
          </h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe as métricas e avaliações da clínica.
          </p>
        </header>

        {/* KPI Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                title="Pacientes Ativos"
                value={metrics?.pacientesAtivos || 0}
                subtitle="Em tratamento"
                icon={<Users className="h-5 w-5" />}
              />
              <MetricCard
                title="Avaliações Pendentes"
                value={metrics?.avaliacoesPendentes || 0}
                subtitle="Aguardando triagem"
                icon={<ClipboardList className="h-5 w-5" />}
                alert={(metrics?.avaliacoesPendentes || 0) > 0}
              />
            </>
          )}
        </section>

        {/* Evaluations Table */}
        <section className="bg-card border border-border/60 rounded-xl overflow-hidden">
          <header className="px-6 py-5 border-b border-border/60">
            <h2 className="font-serif text-lg font-semibold text-foreground">
              Avaliações Recentes
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Clique em uma linha para ver os detalhes completos.
            </p>
          </header>
          
          <EvaluationsTable
            evaluations={evaluations}
            loading={loading}
            onSelectEvaluation={handleSelectEvaluation}
          />
        </section>

        {/* Slide-over for Evaluation Details */}
        <ClinicalDossier
          evaluation={selectedEvaluation}
          open={slideOverOpen}
          onClose={() => setSlideOverOpen(false)}
          onUpdateStatus={handleUpdateStatus}
        />
      </div>
    </AdminLayout>
  );
}
