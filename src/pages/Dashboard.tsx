import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { getGreeting } from '@/lib/greeting';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Activity, Calendar, CheckCircle2 } from 'lucide-react';
import { decryptProfile } from '@/lib/crypto-client';
import { DashboardPageSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { FadeInContent } from '@/components/dashboard/FadeInContent';
import { normalizeTreatmentStatus } from '@/lib/treatment-status';

interface Profile {
  nome: string | null;
}

interface Tratamento {
  status: string;
  plano: string | null;
  data_proxima_renovacao: string | null;
}

interface AvaliacaoResumo {
  status: string;
}

interface MetaDiaria {
  id: string;
  titulo: string;
  concluida: boolean;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tratamento, setTratamento] = useState<Tratamento | null>(null);
  const [avaliacaoRecente, setAvaliacaoRecente] = useState<AvaliacaoResumo | null>(null);
  const [metas, setMetas] = useState<MetaDiaria[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('nome')
        .eq('user_id', user.id)
        .single();

      // Decrypt the name
      const decrypted = await decryptProfile(profileData);
      
      // If name looks like an email, try to get nome_completo from latest avaliacao
      if (decrypted?.nome && decrypted.nome.includes('@')) {
        const { data: avalData } = await supabase
          .from('avaliacoes')
          .select('respostas')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        const nomeCompleto = (avalData?.respostas as Record<string, unknown>)?.nome_completo as string | undefined;
        if (nomeCompleto) {
          decrypted.nome = nomeCompleto;
          // Also update the profile in the database for future use
          await supabase.from('profiles').update({ nome: nomeCompleto }).eq('user_id', user.id);
        }
      }
      
      setProfile(decrypted);

      const today = new Date().toISOString().split('T')[0];
      const [
        tratamentoRes,
        avaliacaoRes,
        metasRes,
      ] = await Promise.all([
        supabase
          .from('tratamentos')
          .select('status, plano, data_proxima_renovacao')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('avaliacoes')
          .select('status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('metas_diarias')
          .select('id, titulo, concluida')
          .eq('user_id', user.id)
          .eq('data', today),
      ]);

      const normalizedStatus = normalizeTreatmentStatus(
        tratamentoRes.data?.status,
        avaliacaoRes.data?.status,
      );

      setTratamento(tratamentoRes.data ? { ...tratamentoRes.data, status: normalizedStatus } : tratamentoRes.data);
      setAvaliacaoRecente(avaliacaoRes.data);

      if (normalizedStatus !== 'nenhum' && tratamentoRes.data?.status !== normalizedStatus) {
        await supabase
          .from('tratamentos')
          .update({ status: normalizedStatus })
          .eq('user_id', user.id);
      }

      setMetas(metasRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMeta = async (metaId: string, currentState: boolean) => {
    const { error } = await supabase
      .from('metas_diarias')
      .update({ concluida: !currentState })
      .eq('id', metaId);

    if (!error) {
      setMetas(metas.map(m => 
        m.id === metaId ? { ...m, concluida: !currentState } : m
      ));
    }
  };

  const isTratamentoAtivo = tratamento?.status === 'em_andamento' || tratamento?.status === 'ativo';
  const statusLabelMap: Record<string, string> = {
    em_analise: 'Em análise',
    aprovado: 'Aprovado',
    processamento: 'Em processamento',
    enviado: 'Enviado',
    entregue: 'Entregue',
    em_andamento: 'Ativo',
    ativo: 'Ativo',
  };
  const statusLabel = tratamento?.status ? statusLabelMap[tratamento.status] || 'Sem tratamento' : 'Sem tratamento';

  // Only compute greeting when we have real data
  const userName = profile?.nome?.split(' ')[0];
  const greeting = userName ? getGreeting(userName) : null;

  return (
    <DashboardLayout>
      {loading ? (
        <DashboardPageSkeleton />
      ) : (
        <FadeInContent>
          <div className="space-y-8">
            {/* Greeting */}
            <div>
              <h1 className="font-serif text-3xl lg:text-4xl font-semibold text-foreground">
                {greeting || getGreeting('')}
              </h1>
              <p className="text-muted-foreground mt-2">
                Acompanhe sua jornada de saúde e bem-estar.
              </p>
            </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="card-elevated">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Status do Tratamento
              </CardTitle>
              <Activity className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  isTratamentoAtivo 
                    ? 'bg-teal/10 text-teal' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {statusLabel}
                </span>
              </div>
              {(tratamento?.plano || avaliacaoRecente?.status === 'pendente') && (
                <p className="text-sm text-muted-foreground mt-1">
                  {tratamento?.plano || 'Sua avaliação está aguardando análise médica.'}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Próxima Renovação
              </CardTitle>
              <Calendar className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">
                {tratamento?.data_proxima_renovacao 
                  ? new Date(tratamento.data_proxima_renovacao).toLocaleDateString('pt-BR')
                  : '-'
                }
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Metas Concluídas Hoje
              </CardTitle>
              <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">
                {metas.filter(m => m.concluida).length}/{metas.length}
              </div>
            </CardContent>
          </Card>
        </div>

            {/* Metas Section - Only show if treatment is active */}
            {isTratamentoAtivo && (
              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle className="font-serif text-xl">Metas para hoje</CardTitle>
                </CardHeader>
                <CardContent>
                  {metas.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhuma meta cadastrada para hoje.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {metas.map((meta) => (
                        <div
                          key={meta.id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-border/40 hover:bg-secondary/50 transition-colors"
                        >
                          <Checkbox
                            checked={meta.concluida}
                            onCheckedChange={() => toggleMeta(meta.id, meta.concluida)}
                          />
                          <span className={meta.concluida ? 'line-through text-muted-foreground' : ''}>
                            {meta.titulo}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </FadeInContent>
      )}
    </DashboardLayout>
  );
}
