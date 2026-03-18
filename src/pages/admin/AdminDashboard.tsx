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
              user_id: a.user_id,
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

  const handleUpdateStatus = async (id: string, newStatus: string, note?: string) => {
    try {
      // Find the evaluation to get user_id
      const evaluation = evaluations.find(e => e.id === id);
      if (!evaluation) throw new Error('Evaluation not found');

      const { error } = await supabase
        .from('avaliacoes')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      const { data: { user: adminUser } } = await supabase.auth.getUser();

      // Create notification for patient
      const notifTitles: Record<string, string> = {
        aprovado: 'Tratamento Aprovado',
        rejeitado: 'Avaliação Não Aprovada',
        ajuste: 'Ajuste Solicitado pela Equipe Médica',
      };
      const notifMsgs: Record<string, string> = {
        aprovado: 'Seu tratamento foi aprovado! Acesse seu painel para ver os próximos passos.',
        rejeitado: 'Sua avaliação não foi aprovada neste momento. Entre em contato para mais informações.',
        ajuste: note || 'A equipe médica solicitou informações adicionais. Por favor, responda o mais breve possível.',
      };

      if (notifTitles[newStatus]) {
        const { error: notifError } = await (supabase.from as any)('notificacoes').insert({
          user_id: evaluation.user_id,
          avaliacao_id: id,
          tipo: newStatus,
          titulo: notifTitles[newStatus],
          mensagem: notifMsgs[newStatus],
        });
        if (notifError) console.error('Notification insert error:', notifError);
      }

      // If adjustment, also create the thread message
      if (newStatus === 'ajuste' && note?.trim()) {
        const { error: ajusteError } = await (supabase.from as any)('ajustes_clinicos').insert({
          avaliacao_id: id,
          user_id: evaluation.user_id,
          autor: 'medico',
          mensagem: note.trim(),
          criado_por: adminUser?.id,
        });
        if (ajusteError) console.error('Ajuste insert error:', ajusteError);
      }

      // If approved, run the full approval workflow
      if (newStatus === 'aprovado') {
        // 1. Update treatment status to aprovado (payment now unlocked for patient)
        await supabase
          .from('tratamentos')
          .update({ 
            status: 'aprovado', 
            plano: 'Protocolo de Gerenciamento Metabólico'
          })
          .eq('user_id', evaluation.user_id);

        // 2. Create prescription
        const { data: { user: adminUser } } = await supabase.auth.getUser();
        await supabase
          .from('prescricoes')
          .insert({
            user_id: evaluation.user_id,
            avaliacao_id: id,
            tratamento: 'Protocolo de Gerenciamento Metabólico',
            dosagem: 'Semaglutida 0.25mg subcutânea, semanal',
            observacoes: 'Prescrição inicial aprovada. Manter hidratação constante.',
            aprovado_por: adminUser?.id,
          });

        // 3. Decrypt patient profile for document
        const { data: profileData } = await supabase
          .from('profiles')
          .select('nome, cpf')
          .eq('user_id', evaluation.user_id)
          .single();

        let patientName = evaluation.patient_name;
        let patientCpf = '';
        if (profileData) {
          try {
            const { data: decNome } = await supabase.functions.invoke('decrypt-data', {
              body: { data: profileData.nome, field: 'nome' }
            });
            if (decNome?.decrypted) patientName = decNome.decrypted;
            
            const { data: decCpf } = await supabase.functions.invoke('decrypt-data', {
              body: { data: profileData.cpf, field: 'cpf' }
            });
            if (decCpf?.decrypted) patientCpf = decCpf.decrypted;
          } catch { /* use fallback names */ }
        }

        // 4. Generate document in documentos table
        const now = new Date();
        await supabase.from('documentos').insert({
          user_id: evaluation.user_id,
          avaliacao_id: id,
          tipo: 'receita_instrucoes',
          titulo: 'Receita — Instruções de Tratamento',
          conteudo: {
            paciente_nome: patientName,
            paciente_cpf: patientCpf,
            medico_nome: 'Dr(a). Responsável Técnico',
            medico_crm: 'CRM/CE 00000',
            instrucoes: 'Protocolo de Gerenciamento Metabólico\n\n• Tomar 1 dose da medicação prescrita (Semaglutida 0,25mg) via subcutânea, uma vez por semana, preferencialmente no mesmo dia e horário.\n\n• Aplicar na região abdominal, coxa ou braço, alternando os locais de aplicação.\n\n• Manter hidratação constante (mínimo 2L de água/dia).\n\n• Seguir dieta balanceada conforme orientação nutricional.\n\n• Relatar qualquer efeito adverso imediatamente à equipe médica.\n\n• Retorno para reavaliação em 30 dias.',
            codigo_autenticidade: `TRATTUM-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${id.slice(0, 8).toUpperCase()}`,
            data_emissao: now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' }),
          },
          criado_por: adminUser?.id,
        });

        // 5. Send approval email (fire and forget) - use service function to get email
        supabase.functions.invoke('send-approval-email', {
          body: { 
            patientEmail: evaluation.user_id, // Edge function resolves email from user_id
            patientName,
          }
        }).catch(err => console.error('Email send error:', err));

        // 6. Log audit
        if (adminUser?.id) {
          await supabase.from('audit_log').insert({
            user_id: adminUser.id,
            action: 'APPROVE_TREATMENT',
            table_name: 'avaliacoes',
            record_id: id,
            details: { target_user_id: evaluation.user_id, status: 'aprovado' },
          });
        }
      }

      toast({
        title: newStatus === 'aprovado' ? 'Tratamento aprovado!' : 'Status atualizado',
        description: newStatus === 'aprovado' 
          ? 'Receita gerada, tratamento ativado e e-mail enviado ao paciente.'
          : `Avaliação marcada como ${newStatus}.`
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
