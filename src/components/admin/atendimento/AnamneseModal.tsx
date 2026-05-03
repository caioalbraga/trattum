import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { getSignedPhotoUrl } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  X, CheckCircle, XCircle, AlertCircle,
  User, Scale, Calendar, Heart, Activity,
  Ruler, Camera, Maximize2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AtendimentoAvaliacao } from '@/pages/admin/AdminAtendimento';
import { AdjustmentDrawer } from './AdjustmentDrawer';

// ── IMC Classification ───────────────────────────────────────────
function imcClassification(imc: number): { label: string; className: string } {
  if (imc < 18.5) return { label: 'Abaixo do Peso', className: 'text-blue-700 bg-blue-50 border-blue-200' };
  if (imc < 25) return { label: 'Peso Normal', className: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  if (imc < 30) return { label: 'Sobrepeso', className: 'text-amber-700 bg-amber-50 border-amber-200' };
  if (imc < 35) return { label: 'Obesidade Grau I', className: 'text-orange-700 bg-orange-50 border-orange-200' };
  if (imc < 40) return { label: 'Obesidade Grau II', className: 'text-red-600 bg-red-50 border-red-200' };
  return { label: 'Obesidade Grau III', className: 'text-red-800 bg-red-100 border-red-300' };
}

function calculateAge(dateStr: string | undefined): number | null {
  if (!dateStr) return null;
  const birth = new Date(dateStr);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// ── Helper: format display value ─────────────────────────────────
function formatVal(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  const str = String(value).trim().toLowerCase();
  if (str === 'true' || str === 'sim') return 'Sim';
  if (str === 'false' || str === 'nao' || str === 'não') return 'Não';
  return String(value);
}

function isPositiveAnswer(value: unknown): boolean {
  const str = formatVal(value);
  return str !== '—' && str !== 'Não';
}

// ── Response Row ─────────────────────────────────────────────────
function ResponseRow({ label, value }: { label: string; value: unknown }) {
  const display = formatVal(value);
  const isPositive = isPositiveAnswer(value);

  return (
    <div className={cn(
      'flex items-start justify-between py-3 px-4 rounded-lg',
      isPositive ? 'bg-primary/[0.03]' : ''
    )}>
      <span className="text-sm text-muted-foreground flex-shrink-0 mr-4">{label}</span>
      <span className={cn(
        'text-sm font-medium text-right',
        isPositive ? 'text-foreground' : 'text-muted-foreground/60'
      )}>
        {display}
      </span>
    </div>
  );
}

// ── Lightbox ─────────────────────────────────────────────────────
function PhotoLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center"
      onClick={(e) => { e.stopPropagation(); onClose(); }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute top-4 right-4 text-white hover:text-white/80 z-[201]"
      >
        <X className="h-8 w-8" />
      </button>
      <img
        src={src}
        alt={alt}
        className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

// ── Silhouette Measurements Display ──────────────────────────────
function MeasurementsDisplay({ respostas }: { respostas: Record<string, unknown> }) {
  const measurements = [
    { key: 'circ_braco', label: 'Braço', position: 'top-[28%] left-[15%]' },
    { key: 'circ_torax', label: 'Tórax', position: 'top-[32%] left-[50%]' },
    { key: 'circ_cintura', label: 'Cintura', position: 'top-[42%] left-[50%]' },
    { key: 'circ_quadril', label: 'Quadril', position: 'top-[50%] left-[50%]' },
    { key: 'circ_perna', label: 'Perna/Coxa', position: 'top-[65%] left-[35%]' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
      {measurements.map(m => {
        const value = respostas[m.key];
        return (
          <div key={m.key} className="text-center p-4 bg-muted/30 rounded-xl border border-border/40">
            <Ruler className="h-4 w-4 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground mb-1">{m.label}</p>
            <p className="text-lg font-semibold text-foreground">
              {value ? `${value} cm` : '—'}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Modal ───────────────────────────────────────────────────
interface Props {
  avaliacao: AtendimentoAvaliacao | null;
  open: boolean;
  onClose: () => void;
  onStatusUpdate: () => Promise<void>;
}

const statusBadges: Record<string, { label: string; className: string }> = {
  pendente: { label: 'Pendente', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  aprovado: { label: 'Aprovado', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  ajuste: { label: 'Ajuste Necessário', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  bloqueado: { label: 'Bloqueado', className: 'bg-red-100 text-red-800 border-red-200' },
  aguardando_pagamento: { label: 'Aguardando Pagamento', className: 'bg-violet-100 text-violet-800 border-violet-200' },
  rejeitado: { label: 'Rejeitado', className: 'bg-red-100 text-red-800 border-red-200' },
};

export function AnamnseModal({ avaliacao, open, onClose, onStatusUpdate }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [showAdjustment, setShowAdjustment] = useState(false);
  const [photos, setPhotos] = useState<Array<{ key: string; label: string; url: string }>>([]);
  const { toast } = useToast();

  // Reset state when switching patients or closing
  useEffect(() => {
    setLightboxSrc(null);
    setShowAdjustment(false);
    setLoading(null);
  }, [avaliacao?.id, open]);

  // Resolve signed URLs for private bucket photos
  const fotoFrente = avaliacao?.respostas?.foto_frente as string | undefined;
  const fotoLateral = avaliacao?.respostas?.foto_lateral as string | undefined;
  const fotoCostas = avaliacao?.respostas?.foto_costas as string | undefined;
  useEffect(() => {
    let active = true;
    if (!avaliacao) { setPhotos([]); return; }
    const specs = [
      { key: 'foto_frente', label: 'Frente', raw: fotoFrente },
      { key: 'foto_lateral', label: 'Lateral', raw: fotoLateral },
      { key: 'foto_costas', label: 'Costas', raw: fotoCostas },
    ];
    (async () => {
      const resolved = await Promise.all(
        specs.map(async (p) => {
          if (!p.raw) return null;
          const url = await getSignedPhotoUrl(p.raw);
          return url ? { key: p.key, label: p.label, url } : null;
        })
      );
      if (active) setPhotos(resolved.filter((x): x is { key: string; label: string; url: string } => !!x));
    })();
    return () => { active = false; };
  }, [avaliacao?.id, fotoFrente, fotoLateral, fotoCostas]);

  if (!avaliacao) return null;

  const r = avaliacao.respostas;
  const age = calculateAge(r.data_nascimento as string | undefined);
  const badge = statusBadges[avaliacao.status] || statusBadges.pendente;
  const imc = avaliacao.imc;
  const imcInfo = imc ? imcClassification(imc) : null;
  const canTakeAction = ['pendente', 'ajuste', 'em_revisao'].includes(avaliacao.status);

  const handleApprove = async () => {
    setLoading('aprovado');
    try {
      await supabase.from('avaliacoes').update({ status: 'aprovado' }).eq('id', avaliacao.id);

      const { data: { user: adminUser } } = await supabase.auth.getUser();

      // Update treatment
      await supabase.from('tratamentos').update({
        status: 'aprovado',
        plano: 'Protocolo de Gerenciamento Metabólico'
      }).eq('user_id', avaliacao.user_id);

      // Create prescription
      await supabase.from('prescricoes').insert({
        user_id: avaliacao.user_id,
        avaliacao_id: avaliacao.id,
        tratamento: 'Protocolo de Gerenciamento Metabólico',
        dosagem: 'Semaglutida 0.25mg subcutânea, semanal',
        observacoes: 'Prescrição inicial aprovada.',
        aprovado_por: adminUser?.id,
      });

      // Create document
      const now = new Date();
      await supabase.from('documentos').insert({
        user_id: avaliacao.user_id,
        avaliacao_id: avaliacao.id,
        tipo: 'receita_instrucoes',
        titulo: 'Receita — Instruções de Tratamento',
        conteudo: {
          paciente_nome: avaliacao.patient_name,
          medico_nome: 'Dr(a). Responsável Técnico',
          medico_crm: 'CRM/CE 00000',
          instrucoes: 'Protocolo de Gerenciamento Metabólico',
          data_emissao: now.toLocaleDateString('pt-BR'),
        },
        criado_por: adminUser?.id,
      });

      // Notification
      await supabase.from('notificacoes').insert({
        user_id: avaliacao.user_id,
        avaliacao_id: avaliacao.id,
        tipo: 'aprovado',
        titulo: 'Tratamento Aprovado',
        mensagem: 'Seu tratamento foi aprovado! Acesse seu painel para ver os próximos passos.',
      });

      // Send email
      supabase.functions.invoke('send-approval-email', {
        body: { patientEmail: avaliacao.user_id, patientName: avaliacao.patient_name }
      }).catch(console.error);

      toast({ title: 'Tratamento aprovado!', description: 'Receita gerada e paciente notificado.' });
      await onStatusUpdate();
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Erro ao aprovar' });
    } finally {
      setLoading(null);
    }
  };

  const handleBlock = async () => {
    setLoading('bloqueado');
    try {
      await supabase.from('avaliacoes').update({ status: 'bloqueado' }).eq('id', avaliacao.id);
      await supabase.from('notificacoes').insert({
        user_id: avaliacao.user_id,
        avaliacao_id: avaliacao.id,
        tipo: 'bloqueado',
        titulo: 'Avaliação Bloqueada',
        mensagem: 'Sua avaliação foi bloqueada pela equipe médica. Entre em contato para mais informações.',
      });
      toast({ title: 'Avaliação bloqueada' });
      await onStatusUpdate();
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Erro ao bloquear' });
    } finally {
      setLoading(null);
    }
  };

  // Gestational section - only show for female
  const isFemale = String(r.sexo || '').toLowerCase() === 'feminino';

  // Photo signed URLs (bucket privado)
  const photoSpecs = [
    { key: 'foto_frente', label: 'Frente' },
    { key: 'foto_lateral', label: 'Lateral' },
    { key: 'foto_costas', label: 'Costas' },
  ];
  const [photos, setPhotos] = useState<Array<{ key: string; label: string; url: string }>>([]);
  useEffect(() => {
    let active = true;
    (async () => {
      const resolved = await Promise.all(
        photoSpecs.map(async (p) => {
          const raw = r[p.key] as string | undefined;
          if (!raw) return null;
          const url = await getSignedPhotoUrl(raw);
          return url ? { ...p, url } : null;
        })
      );
      if (active) setPhotos(resolved.filter((x): x is { key: string; label: string; url: string } => !!x));
    })();
    return () => { active = false; };
  }, [r.foto_frente, r.foto_lateral, r.foto_costas]);

  return (
    <Dialog open={open} onOpenChange={isOpen => { if (!isOpen && !lightboxSrc) onClose(); }}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] p-0 flex flex-col gap-0 overflow-hidden [&>button.absolute]:hidden">
          {/* Header */}
          <header className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-border/60 bg-card">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <User className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h2 className="font-serif text-xl font-semibold text-foreground leading-tight">
                    {avaliacao.patient_name}
                  </h2>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(avaliacao.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn('px-3 py-1 text-xs font-medium', badge.className)}>
                  {badge.label}
                </Badge>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </header>

          {/* Scrollable Body */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-6 space-y-8">

              {/* Section 1: Identificação */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-4 w-4 text-primary" />
                  <h3 className="font-serif text-base font-semibold text-foreground">Identificação</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="bg-muted/30 rounded-xl p-4 border border-border/40">
                    <p className="text-xs text-muted-foreground mb-1">Nome Completo</p>
                    <p className="text-sm font-semibold">{formatVal(r.nome_completo)}</p>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-4 border border-border/40">
                    <p className="text-xs text-muted-foreground mb-1">Data de Nascimento</p>
                    <p className="text-sm font-semibold">
                      {r.data_nascimento ? format(new Date(r.data_nascimento as string), "dd/MM/yyyy") : '—'}
                      {age !== null && <span className="text-muted-foreground font-normal ml-1">({age} anos)</span>}
                    </p>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-4 border border-border/40">
                    <p className="text-xs text-muted-foreground mb-1">Sexo</p>
                    <p className="text-sm font-semibold">{formatVal(r.sexo)}</p>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-4 border border-border/40">
                    <p className="text-xs text-muted-foreground mb-1">Peso</p>
                    <p className="text-sm font-semibold">{r.peso_atual ? `${r.peso_atual} kg` : '—'}</p>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-4 border border-border/40">
                    <p className="text-xs text-muted-foreground mb-1">Altura</p>
                    <p className="text-sm font-semibold">{r.altura ? `${r.altura} cm` : '—'}</p>
                  </div>
                  {imc && imcInfo && (
                    <div className={cn('rounded-xl p-4 border', imcInfo.className)}>
                      <p className="text-xs opacity-70 mb-1">IMC Calculado</p>
                      <p className="text-sm font-bold">{imc.toFixed(1)} — {imcInfo.label}</p>
                    </div>
                  )}
                </div>
              </section>

              <Separator />

              {/* Section 2: Histórico de Saúde */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Heart className="h-4 w-4 text-primary" />
                  <h3 className="font-serif text-base font-semibold text-foreground">Histórico de Saúde</h3>
                </div>
                <div className="space-y-1 divide-y divide-border/30">
                  <ResponseRow label="Medicamentos em uso contínuo" value={r.usa_medicamento_continuo} />
                  {isPositiveAnswer(r.usa_medicamento_continuo) && (
                    <div className="py-2 px-4 bg-amber-50/50 rounded-lg border border-amber-200/50">
                      <p className="text-xs text-muted-foreground mb-1">Quais medicamentos</p>
                      <p className="text-sm font-medium text-foreground">{formatVal(r.detalhe_medicamento_continuo)}</p>
                    </div>
                  )}
                  <ResponseRow label="Histórico familiar de doenças" value={r.historico_familiar_doencas} />
                  {isPositiveAnswer(r.historico_familiar_doencas) && (
                    <div className="py-2 px-4 bg-amber-50/50 rounded-lg border border-amber-200/50">
                      <p className="text-xs text-muted-foreground mb-1">Detalhes</p>
                      <p className="text-sm font-medium text-foreground">{formatVal(r.detalhe_historico_familiar)}</p>
                    </div>
                  )}
                  <ResponseRow label="Cirurgias prévias" value={r.cirurgia_previa} />
                  {isPositiveAnswer(r.cirurgia_previa) && (
                    <div className="py-2 px-4 bg-amber-50/50 rounded-lg border border-amber-200/50">
                      <p className="text-xs text-muted-foreground mb-1">Detalhes</p>
                      <p className="text-sm font-medium text-foreground">{formatVal(r.detalhe_cirurgia)}</p>
                    </div>
                  )}
                  {isFemale && (
                    <>
                      <ResponseRow label="Já esteve grávida" value={r.ja_esteve_gravida} />
                      {isPositiveAnswer(r.ja_esteve_gravida) && (
                        <>
                          <ResponseRow label="Número de gestações" value={r.quantas_gestacoes} />
                          <ResponseRow label="Houve aborto" value={r.houve_aborto} />
                        </>
                      )}
                    </>
                  )}
                </div>
              </section>

              <Separator />

              {/* Section 3: Estilo de Vida */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="h-4 w-4 text-primary" />
                  <h3 className="font-serif text-base font-semibold text-foreground">Estilo de Vida</h3>
                </div>
                <div className="space-y-1 divide-y divide-border/30">
                  <ResponseRow label="Acompanhamento nutricional" value={r.acompanhamento_nutricional} />
                  <ResponseRow label="Prática de atividade física" value={r.pratica_atividade_fisica} />
                </div>
              </section>

              <Separator />

              {/* Section 4: Medidas Corporais */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Ruler className="h-4 w-4 text-primary" />
                  <h3 className="font-serif text-base font-semibold text-foreground">Medidas Corporais</h3>
                </div>
                <MeasurementsDisplay respostas={r} />
              </section>

              <Separator />

              {/* Section 5: Fotos */}
              {photos.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Camera className="h-4 w-4 text-primary" />
                    <h3 className="font-serif text-base font-semibold text-foreground">Fotos</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {photos.map(photo => (
                      <button
                        key={photo.key}
                        onClick={() => setLightboxSrc(photo.url!)}
                        className="group relative rounded-xl overflow-hidden border border-border/40 aspect-[3/4] bg-muted/20"
                      >
                        <img
                          src={photo.url}
                          alt={photo.label}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <Maximize2 className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <span className="absolute bottom-2 left-2 text-xs font-medium text-white bg-black/50 px-2 py-1 rounded">
                          {photo.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </ScrollArea>

          {/* Adjustment Drawer */}
          {showAdjustment && (
            <AdjustmentDrawer
              avaliacao={avaliacao}
              onClose={() => setShowAdjustment(false)}
              onSubmitted={async () => {
                setShowAdjustment(false);
                await onStatusUpdate();
              }}
            />
          )}

          {/* Action Footer */}
          {canTakeAction && (
            <footer className="flex-shrink-0 border-t border-border/60 bg-card px-6 py-4">
              <div className="flex gap-3 justify-end">
                <Button
                  size="sm"
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleApprove}
                  disabled={loading !== null}
                >
                  <CheckCircle className="h-4 w-4" />
                  {loading === 'aprovado' ? 'Aprovando…' : 'Aprovar'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-50"
                  onClick={() => setShowAdjustment(true)}
                  disabled={loading !== null}
                >
                  <AlertCircle className="h-4 w-4" />
                  Solicitar Ajuste
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 border-red-300 text-red-700 hover:bg-red-50"
                  onClick={handleBlock}
                  disabled={loading !== null}
                >
                  <XCircle className="h-4 w-4" />
                  {loading === 'bloqueado' ? 'Bloqueando…' : 'Bloquear'}
                </Button>
              </div>
            </footer>
          )}

          {/* Lightbox rendered inside dialog so it doesn't close the modal */}
          {lightboxSrc && <PhotoLightbox src={lightboxSrc} alt="Foto" onClose={() => setLightboxSrc(null)} />}
        </DialogContent>
      </Dialog>
  );
}
