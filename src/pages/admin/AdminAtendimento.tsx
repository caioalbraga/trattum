import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { decryptProfiles } from '@/lib/crypto-client';
import { Loader2, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AtendimentoPatientCard } from '@/components/admin/atendimento/PatientCard';
import { AnamnseModal } from '@/components/admin/atendimento/AnamneseModal';

export interface AtendimentoAvaliacao {
  id: string;
  user_id: string;
  respostas: Record<string, unknown>;
  status: string;
  imc: number | null;
  created_at: string;
  patient_name: string;
}

const filters: { key: string; label: string | null; icon?: typeof Lock }[] = [
  { key: 'pendente', label: 'Pendentes' },
  { key: 'ajuste', label: 'Ajustes' },
  { key: 'aguardando_pagamento', label: 'Esperando Pagamento' },
  { key: 'aprovado', label: 'Aprovados' },
  { key: 'bloqueado', label: null, icon: Lock },
];

type FilterKey = typeof filters[number]['key'];

export default function AdminAtendimento() {
  const [avaliacoes, setAvaliacoes] = useState<AtendimentoAvaliacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('pendente');
  const [selectedAvaliacao, setSelectedAvaliacao] = useState<AtendimentoAvaliacao | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAvaliacoes();
  }, []);

  const fetchAvaliacoes = async () => {
    try {
      const { data, error } = await supabase
        .from('avaliacoes')
        .select('id, user_id, respostas, status, imc, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const userIds = [...new Set(data?.map(a => a.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, nome')
        .in('user_id', userIds);

      const decryptedProfiles = await decryptProfiles(profiles || []);
      const profileMap = new Map(decryptedProfiles.map(p => [p.user_id, p.nome]));

      // Also check which user_ids have approved treatment (for aguardando_pagamento filter)
      const { data: tratamentos } = await supabase
        .from('tratamentos')
        .select('user_id, status')
        .in('user_id', userIds);

      const tratamentoMap = new Map(tratamentos?.map(t => [t.user_id, t.status]) || []);

      const mapped: AtendimentoAvaliacao[] = (data || []).map(a => {
        const profileName = profileMap.get(a.user_id);
        const nomeCompleto = (a.respostas as Record<string, unknown>)?.nome_completo as string | undefined;
        const isEmail = profileName?.includes('@');
        const patientName = (isEmail && nomeCompleto) ? nomeCompleto : (profileName || nomeCompleto || 'Paciente');

        // Derive a virtual status for filtering
        let virtualStatus = a.status;
        if (a.status === 'aprovado' && tratamentoMap.get(a.user_id) === 'aprovado') {
          virtualStatus = 'aguardando_pagamento';
        }

        return {
          ...a,
          respostas: a.respostas as Record<string, unknown>,
          patient_name: patientName,
          status: virtualStatus,
        };
      });

      setAvaliacoes(mapped);
    } catch (error) {
      console.error('Error fetching avaliacoes:', error);
      toast({ variant: 'destructive', title: 'Erro ao carregar avaliações' });
    } finally {
      setLoading(false);
    }
  };

  const filteredAvaliacoes = avaliacoes.filter(a => a.status === activeFilter);

  const handleOpenAnamnese = (avaliacao: AtendimentoAvaliacao) => {
    setSelectedAvaliacao(avaliacao);
    setModalOpen(true);
  };

  const handleStatusUpdate = async () => {
    await fetchAvaliacoes();
    setModalOpen(false);
    setSelectedAvaliacao(null);
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
      <div className="max-w-5xl mx-auto space-y-6">
        <header>
          <h1 className="font-serif text-2xl font-semibold text-foreground">Atendimento</h1>
          <p className="text-muted-foreground mt-1">Triagem clínica e gestão de avaliações</p>
        </header>

        {/* Filter Chips */}
        <div className="flex flex-wrap gap-2">
          {filters.map(f => {
            const count = avaliacoes.filter(a => a.status === f.key).length;
            const isActive = activeFilter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
                  'border',
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card text-muted-foreground border-border/60 hover:bg-muted/50 hover:text-foreground'
                )}
              >
                {f.icon && <f.icon className="h-3.5 w-3.5" />}
                {f.label && <span>{f.label}</span>}
                <span className={cn(
                  'inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-xs font-semibold',
                  isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Patient Cards */}
        <div className="space-y-3">
          {filteredAvaliacoes.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-lg">Nenhuma avaliação nesta categoria.</p>
            </div>
          ) : (
            filteredAvaliacoes.map(avaliacao => (
              <AtendimentoPatientCard
                key={avaliacao.id}
                avaliacao={avaliacao}
                onViewAnamnese={() => handleOpenAnamnese(avaliacao)}
              />
            ))
          )}
        </div>

        {/* Anamnese Modal */}
        <AnamnseModal
          avaliacao={selectedAvaliacao}
          open={modalOpen}
          onClose={() => { setModalOpen(false); setSelectedAvaliacao(null); }}
          onStatusUpdate={handleStatusUpdate}
        />
      </div>
    </AdminLayout>
  );
}
