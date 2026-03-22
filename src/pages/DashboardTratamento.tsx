import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  FileText, Calendar, Activity, ArrowRight, Sparkles, CreditCard,
  Clock, Shield, Pill, Search, Truck, PackageCheck, CheckCircle2, Circle,
  XCircle,
} from 'lucide-react';
import { TratamentoSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { FadeInContent } from '@/components/dashboard/FadeInContent';
import { TCLEModal } from '@/components/consent/TCLEModal';
import { PrescriptionModal } from '@/components/documents/PrescriptionModal';
import { decryptProfile } from '@/lib/crypto-client';
import { cn } from '@/lib/utils';
import { normalizeTreatmentStatus } from '@/lib/treatment-status';

interface Tratamento {
  status: string;
  plano: string | null;
  data_inicio: string | null;
  data_proxima_renovacao: string | null;
  documento_pdf_url: string | null;
  observacoes: string | null;
}

interface Pedido {
  id: string;
  status: string;
  valor: number;
  descricao: string | null;
  created_at: string;
}

interface ConsentLog {
  id: string;
  consent_timestamp: string;
  terms_version: string;
  document_hash: string;
  ip_address: string;
  email_sent: boolean;
  user_agent?: string | null;
}

interface Documento {
  id: string;
  tipo: string;
  titulo: string;
  conteudo: Record<string, any>;
  created_at: string;
}

interface UserProfile {
  nome?: string | null;
  cpf?: string | null;
  email?: string;
}

// ── Pipeline stages ──────────────────────────────────────────────
const STAGES = [
  { key: 'em_analise', label: 'Em Análise', icon: Search, description: 'Sua anamnese está sendo avaliada pela equipe médica.' },
  { key: 'aprovado', label: 'Aprovado', icon: CheckCircle2, description: 'Seu tratamento foi aprovado! Finalize o pagamento para dar continuidade.' },
  { key: 'processamento', label: 'Em Processamento', icon: Clock, description: 'Pagamento confirmado. Estamos preparando seu tratamento.' },
  { key: 'enviado', label: 'Enviado', icon: Truck, description: 'Seu tratamento foi enviado para o endereço cadastrado.' },
  { key: 'entregue', label: 'Entregue', icon: PackageCheck, description: 'Tratamento entregue! Confirme o recebimento para iniciar.' },
  { key: 'em_andamento', label: 'Em Andamento', icon: Activity, description: 'Seu tratamento está ativo. Acompanhe sua evolução abaixo.' },
] as const;

type StageKey = typeof STAGES[number]['key'];

function getStageIndex(status: string): number {
  return STAGES.findIndex(s => s.key === status);
}

// ── Stage Pipeline component ─────────────────────────────────────
function StagePipeline({ currentStatus }: { currentStatus: string }) {
  const currentIdx = getStageIndex(currentStatus);

  return (
    <div className="space-y-1">
      {/* Current stage highlight */}
      {currentIdx >= 0 && (
        <div className="mb-6 p-5 rounded-xl bg-secondary/60 border border-border/40">
          <div className="flex items-center gap-3 mb-2">
            {(() => {
              const CurrentIcon = STAGES[currentIdx].icon;
              return (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <CurrentIcon className="h-5 w-5" />
                </div>
              );
            })()}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Etapa atual
              </p>
              <p className="font-serif text-lg font-semibold text-foreground">
                {STAGES[currentIdx].label}
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed pl-[52px]">
            {STAGES[currentIdx].description}
          </p>
        </div>
      )}

      {/* Horizontal progress bar */}
      <div className="px-1">
        {/* Steps row */}
        <div className="flex items-center justify-between gap-0">
          {STAGES.map((stage, idx) => {
            const isCurrent = idx === currentIdx;
            const isDone = idx < currentIdx;
            const isFuture = idx > currentIdx;
            const StageIcon = stage.icon;
            const isLast = idx === STAGES.length - 1;

            return (
              <div key={stage.key} className="flex items-center flex-1 last:flex-none">
                {/* Node */}
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300',
                      isDone && 'bg-primary text-primary-foreground shadow-sm',
                      isCurrent && 'bg-primary text-primary-foreground shadow-md ring-[3px] ring-primary/20',
                      isFuture && 'bg-muted text-muted-foreground/50 border border-border',
                    )}
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <StageIcon className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <span className={cn(
                    'text-[10px] font-medium text-center leading-tight w-16',
                    isDone && 'text-foreground',
                    isCurrent && 'text-foreground font-semibold',
                    isFuture && 'text-muted-foreground/60',
                  )}>
                    {stage.label}
                  </span>
                </div>

                {/* Connector line */}
                {!isLast && (
                  <div className="flex-1 h-[2px] mx-1 mt-[-20px]">
                    <div
                      className={cn(
                        'h-full rounded-full transition-colors duration-300',
                        idx < currentIdx ? 'bg-primary' : 'bg-border',
                      )}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────
export default function DashboardTratamento() {
  const { user } = useAuth();
  const [tratamento, setTratamento] = useState<Tratamento | null>(null);
  const [evaluationStatus, setEvaluationStatus] = useState<string | null>(null);
  const [pedidoPendente, setPedidoPendente] = useState<Pedido | null>(null);
  const [consentLogs, setConsentLogs] = useState<ConsentLog[]>([]);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [consentLoading, setConsentLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedConsent, setSelectedConsent] = useState<ConsentLog | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<Documento | null>(null);
  const [tcleModalOpen, setTcleModalOpen] = useState(false);
  const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) fetchData(); }, [user]);

  const fetchData = async () => {
    if (!user) return;
    try {
      const [tratamentoRes, pedidoRes, consentRes, profileRes, docRes, avaliacaoRes] = await Promise.all([
        supabase.from('tratamentos').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('pedidos').select('*').eq('user_id', user.id).eq('status', 'pendente')
          .order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('consent_logs')
          .select('id, consent_timestamp, terms_version, document_hash, ip_address, email_sent, user_agent')
          .eq('user_id', user.id).is('revoked_at', null)
          .order('consent_timestamp', { ascending: false }),
        supabase.from('profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('documentos')
          .select('id, tipo, titulo, conteudo, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase.from('avaliacoes')
          .select('status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      const normalizedStatus = normalizeTreatmentStatus(tratamentoRes.data?.status, avaliacaoRes.data?.status);

      setTratamento(tratamentoRes.data ? { ...tratamentoRes.data, status: normalizedStatus } : tratamentoRes.data);
      setEvaluationStatus(avaliacaoRes.data?.status || null);
      setPedidoPendente(pedidoRes.data);
      setConsentLogs(consentRes.data || []);
      setDocumentos((docRes.data as Documento[]) || []);

      if (normalizedStatus !== 'nenhum' && tratamentoRes.data?.status !== normalizedStatus) {
        await supabase
          .from('tratamentos')
          .update({ status: normalizedStatus })
          .eq('user_id', user.id);
      }

      if (profileRes.data) {
        const decrypted = await decryptProfile(profileRes.data);
        setUserProfile({ nome: decrypted?.nome || null, cpf: decrypted?.cpf || null, email: user.email });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setConsentLoading(false);
    }
  };

  const rawStatus = normalizeTreatmentStatus(tratamento?.status, evaluationStatus);
  const status = rawStatus === 'ativo' ? 'em_andamento' : rawStatus;
  const isRejected = evaluationStatus === 'rejeitado' || status === 'rejeitado';
  const stageIdx = getStageIndex(status);
  const isInPipeline = stageIdx >= 0;
  const isActive = status === 'em_andamento';

  if (loading) {
    return <DashboardLayout><TratamentoSkeleton /></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <FadeInContent>
        <div className="space-y-8">
          <div>
            <h1 className="font-serif text-3xl lg:text-4xl font-semibold text-foreground">Tratamento</h1>
            <p className="text-muted-foreground mt-2">Acompanhe a evolução do seu plano de saúde.</p>
          </div>

          {/* ── No assessment yet ── */}
          {!isInPipeline && (
            <Card className="card-elevated border-2 border-dashed border-primary/20">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-6">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h2 className="font-serif text-2xl font-semibold mb-2">Inicie sua jornada</h2>
                <p className="text-muted-foreground max-w-md mb-6">
                  Faça nossa avaliação clínica para descobrir o melhor tratamento para você. É rápido, seguro e personalizado.
                </p>
                <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Link to="/anamnese">
                    Começar Avaliação
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* ── Pipeline view (stages 1-5) ── */}
          {isInPipeline && !isActive && (
            <>
              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle className="font-serif text-xl">Status do Tratamento</CardTitle>
                  <CardDescription>Acompanhe cada etapa do seu tratamento.</CardDescription>
                </CardHeader>
                <CardContent>
                  <StagePipeline currentStatus={status} />
                </CardContent>
              </Card>

              {/* Payment CTA — only when status = aprovado */}
              {status === 'aprovado' && (
                <Card className="card-elevated border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-5">
                      <CreditCard className="w-7 h-7 text-primary" />
                    </div>
                    <h2 className="font-serif text-xl font-semibold mb-2">Finalize o pagamento</h2>
                    <p className="text-muted-foreground max-w-md mb-6 text-sm">
                      Seu tratamento foi aprovado pela equipe médica. Complete o pagamento para iniciarmos o envio.
                    </p>
                    <Button asChild size="lg">
                      <Link to="/checkout">
                        Ir para Pagamento
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* ── Active treatment (em_andamento) ── */}
          {isActive && (
            <>
              <Card className="card-elevated">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="font-serif text-xl flex items-center gap-2">
                        <Activity className="w-5 h-5 text-teal" />
                        Seu Plano Atual
                      </CardTitle>
                      <CardDescription className="mt-1">{tratamento?.plano || 'Plano personalizado'}</CardDescription>
                    </div>
                    <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-teal/10 text-teal">
                      Ativo
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="w-4 h-4" />Data de Início
                      </p>
                      <p className="font-medium">
                        {tratamento?.data_inicio ? new Date(tratamento.data_inicio).toLocaleDateString('pt-BR') : '-'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="w-4 h-4" />Próxima Renovação
                      </p>
                      <p className="font-medium">
                        {tratamento?.data_proxima_renovacao ? new Date(tratamento.data_proxima_renovacao).toLocaleDateString('pt-BR') : '-'}
                      </p>
                    </div>
                  </div>
                  {tratamento?.observacoes && (
                    <div className="mt-6 p-4 bg-secondary/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Observações</p>
                      <p className="mt-1">{tratamento.observacoes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Documents */}
              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle className="font-serif text-xl flex items-center gap-2">
                    <FileText className="w-5 h-5" />Documentos
                  </CardTitle>
                  <CardDescription>Receitas, instruções de tratamento e termos aceitos</CardDescription>
                </CardHeader>
                <CardContent>
                  {consentLoading ? (
                    <div className="space-y-3"><Skeleton className="h-20 w-full rounded-lg" /><Skeleton className="h-20 w-full rounded-lg" /></div>
                  ) : documentos.length === 0 && consentLogs.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4 text-sm">Nenhum documento disponível no momento.</p>
                  ) : (
                    <div className="space-y-3">
                      {documentos.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between p-4 rounded-lg border border-border/40 hover:border-border transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Pill className="size-4 text-primary" /></div>
                            <div>
                              <p className="font-medium text-sm">{doc.titulo}</p>
                              <p className="text-xs text-muted-foreground">Emitido em {new Date(doc.created_at).toLocaleDateString('pt-BR')}</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => { setSelectedDoc(doc); setPrescriptionModalOpen(true); }}>
                            <FileText className="w-4 h-4 mr-1" />Ver Receita
                          </Button>
                        </div>
                      ))}
                      {consentLogs.map(log => (
                        <div key={log.id} className="flex items-center justify-between p-4 rounded-lg border border-border/40 hover:border-border transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-lg bg-muted flex items-center justify-center shrink-0"><FileText className="size-4 text-muted-foreground" /></div>
                            <div>
                              <p className="font-medium text-sm">Termo de Consentimento (TCLE)</p>
                              <p className="text-xs text-muted-foreground">Versão {log.terms_version} — {new Date(log.consent_timestamp).toLocaleDateString('pt-BR')}</p>
                              <div className="flex items-center gap-1 mt-0.5">
                                <Shield className="size-3 text-muted-foreground" />
                                <p className="text-xs font-mono text-muted-foreground">{log.document_hash.slice(0, 12)}…</p>
                              </div>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => { setSelectedConsent(log); setTcleModalOpen(true); }}>
                            <FileText className="w-4 h-4 mr-1" />Ver Documento
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <TCLEModal open={tcleModalOpen} onClose={() => setTcleModalOpen(false)} consentLog={selectedConsent} userProfile={userProfile} isLoading={consentLoading} />
              <PrescriptionModal open={prescriptionModalOpen} onClose={() => setPrescriptionModalOpen(false)} documento={selectedDoc} />
            </>
          )}
        </div>
      </FadeInContent>
    </DashboardLayout>
  );
}
