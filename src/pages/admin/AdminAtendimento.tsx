import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { decryptProfiles } from '@/lib/crypto-client';
import { Loader2, Lock, Clock, AlertCircle, CreditCard, CheckCircle2, LucideIcon } from 'lucide-react';
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

const filters: { key: string; label: string; shortLabel: string; icon: LucideIcon }[] = [
  { key: 'pendente', label: 'Pendentes', shortLabel: 'Pendentes', icon: Clock },
  { key: 'ajuste', label: 'Ajustes', shortLabel: 'Ajustes', icon: AlertCircle },
  { key: 'aguardando_pagamento', label: 'Esperando Pagamento', shortLabel: 'Pagto.', icon: CreditCard },
  { key: 'aprovado', label: 'Aprovados', shortLabel: 'Aprovados', icon: CheckCircle2 },
  { key: 'bloqueado', label: 'Bloqueados', shortLabel: 'Bloq.', icon: Lock },
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
      <div className="max-w-5xl mx-auto space-y-6 pb-24 md:pb-0">
        <header>
          <h1 className="font-serif text-2xl font-semibold text-foreground">Atendimento</h1>
          <p className="text-muted-foreground mt-1">Triagem clínica e gestão de avaliações</p>
        </header>

        {/* Filter Chips (desktop/tablet) */}
        <div className="hidden md:flex flex-wrap gap-2">
          {filters.map(f => {
            const count = avaliacoes.filter(a => a.status === f.key).length;
            const isActive = activeFilter === f.key;
            const Icon = f.icon;
            return (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 min-h-[44px]',
                  'border',
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card text-muted-foreground border-border/60 hover:bg-muted/50 hover:text-foreground'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{f.label}</span>
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

        {/* Active filter label (mobile) */}
        <div className="md:hidden">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {filters.find(f => f.key === activeFilter)?.label}
          </h2>
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

        {/* Bottom Nav (mobile) */}
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur border-t border-border/60"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <ul className="grid grid-cols-5">
            {filters.map(f => {
              const count = avaliacoes.filter(a => a.status === f.key).length;
              const isActive = activeFilter === f.key;
              const Icon = f.icon;
              return (
                <li key={f.key}>
                  <button
                    onClick={() => setActiveFilter(f.key)}
                    className={cn(
                      'w-full flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] relative transition-colors',
                      isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                    )}
                    aria-label={f.label}
                  >
                    <div className="relative">
                      <Icon className="h-5 w-5" />
                      {count > 0 && (
                        <span className={cn(
                          'absolute -top-1.5 -right-2 inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full text-[10px] font-semibold',
                          isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        )}>
                          {count}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-medium leading-tight">{f.shortLabel}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

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
