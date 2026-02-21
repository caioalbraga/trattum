import { useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  X,
  CheckCircle,
  AlertCircle,
  XCircle,
  User,
  Scale,
  Calendar,
  Activity,
  Heart,
  Utensils,
  Target,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Evaluation } from './EvaluationsTable';

interface ClinicalDossierProps {
  evaluation: Evaluation | null;
  open: boolean;
  onClose: () => void;
  onUpdateStatus?: (id: string, status: string, note?: string) => Promise<void>;
}

// ── Status config ────────────────────────────────────────────────────────────
const statusConfig: Record<string, { label: string; className: string; icon: typeof CheckCircle }> = {
  pendente:  { label: 'Pendente',           className: 'bg-amber-100  text-amber-800  border-amber-200',  icon: AlertCircle },
  aprovado:  { label: 'Aprovado',           className: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle },
  ajuste:    { label: 'Ajuste Necessário',  className: 'bg-blue-100   text-blue-800   border-blue-200',   icon: AlertCircle },
  rejeitado: { label: 'Rejeitado',          className: 'bg-red-100    text-red-800    border-red-200',    icon: XCircle },
};

// ── Question label map ───────────────────────────────────────────────────────
const questionLabels: Record<string, string> = {
  motivos_emagrecer:        'Motivos para emagrecer',
  apoio_programa:           'Áreas de apoio desejadas',
  dificuldade_emagrecimento:'Principal dificuldade',
  genero_nascimento:        'Gênero ao nascimento',
  idade:                    'Faixa etária',
  altura_peso:              'Altura / Peso',
  tem_meta_peso:            'Tem meta de peso?',
  qual_meta_peso:           'Meta de peso (kg)',
  peso_maximo:              'Peso máximo na vida (kg)',
  gordura_localizada:       'Região de gordura localizada',
  tempo_tentativa:          'Tempo tentando emagrecer',
  metodos_anteriores:       'Métodos já utilizados',
  frequencia_exercicios:    'Frequência de exercícios',
  vontade_comer_incontrolavel: 'Fome incontrolável fora das refeições',
  comer_estressado:         'Come quando estressado?',
  habito_beliscar:          'Hábito de beliscar',
  consumo_alcool:           'Consumo de álcool',
  etapa_21_triagem_transtorno: 'Diagnóstico de transtorno alimentar?',
  etapa_22_qual_transtorno: 'Qual transtorno alimentar',
  etapa_23_bulimia_3meses:  'Comportamento bulímico (últimos 3 meses)',
  etapa_24_anorexia_3meses: 'Restrição severa alimentar (últimos 3 meses)',
  saude_mental_diagnostico: 'Condição de saúde mental diagnosticada?',
  quais_condicoes_mentais:  'Condições mentais diagnosticadas',
  tomando_medicamento_mental:'Medicamento para saúde mental?',
  detalhe_medicamento_mental:'Qual medicamento mental',
  condicoes_medicas_lista:  'Condições médicas (coração, rins, fígado…)?',
  etapa_30:                 'Doenças do coração',
  etapa_31:                 'Doenças hormonais ou renais',
  etapa_32:                 'Problemas de estômago/intestino',
  etapa_33:                 'Condições adicionais (Convulsões, Glaucoma, Câncer)',
  etapa_34:                 'Condições: Pressão Alta, Colesterol, Refluxo, Apneia',
  etapa_35:                 'Cirurgia bariátrica',
  etapa_36:                 'Medicamentos / suplementos (últimos 30 dias)?',
  etapa_37:                 'Quais medicamentos e por quê',
  etapa_38:                 'Possui alergias?',
  etapa_39:                 'Alergia a qual medicamento',
  etapa_40:                 'Informações adicionais de saúde?',
  etapa_41:                 'Detalhes adicionais',
  etapa_43:                 'Aceita medicamentos injetáveis?',
};

// ── Clinical risk flags ──────────────────────────────────────────────────────
const riskKeys = new Set([
  'etapa_22_qual_transtorno',
  'etapa_23_bulimia_3meses',
  'etapa_24_anorexia_3meses',
  'quais_condicoes_mentais',
  'etapa_30',
  'etapa_31',
  'etapa_32',
  'etapa_33',
  'etapa_39',
  'consumo_alcool',
  'detalhe_medicamento_mental',
]);

const riskValues = new Set([
  'sim', 'anorexia', 'bulimia', 'infarto', 'diabetes1',
  'pancreatite', 'graves', 'saxenda', 'semaglutida',
  'glaucoma', 'diariamente_risco', 'bipolar',
]);

function isRisk(key: string, value: unknown): boolean {
  if (!riskKeys.has(key)) return false;
  const str = Array.isArray(value) ? value.join(' ') : String(value);
  return riskValues.has(str) || riskValues.has(str.toLowerCase());
}

// ── Section definitions ──────────────────────────────────────────────────────
interface Section {
  id: string;
  title: string;
  icon: typeof Activity;
  keys: string[];
}

const sections: Section[] = [
  {
    id: 'biometria',
    title: 'Biometria e IMC',
    icon: Scale,
    keys: ['genero_nascimento', 'idade', 'altura_peso', 'tem_meta_peso', 'qual_meta_peso', 'peso_maximo', 'gordura_localizada'],
  },
  {
    id: 'historico',
    title: 'Histórico de Saúde',
    icon: Heart,
    keys: [
      'condicoes_medicas_lista', 'etapa_30', 'etapa_31', 'etapa_32', 'etapa_33', 'etapa_34', 'etapa_35',
      'etapa_36', 'etapa_37', 'etapa_38', 'etapa_39', 'etapa_40', 'etapa_41',
      'etapa_21_triagem_transtorno', 'etapa_22_qual_transtorno',
      'etapa_23_bulimia_3meses', 'etapa_24_anorexia_3meses',
      'saude_mental_diagnostico', 'quais_condicoes_mentais',
      'tomando_medicamento_mental', 'detalhe_medicamento_mental',
      'consumo_alcool', 'etapa_43',
    ],
  },
  {
    id: 'estilo_vida',
    title: 'Estilo de Vida e Hábitos',
    icon: Activity,
    keys: [
      'frequencia_exercicios', 'vontade_comer_incontrolavel', 'comer_estressado',
      'habito_beliscar', 'tempo_tentativa', 'metodos_anteriores',
    ],
  },
  {
    id: 'metas',
    title: 'Metas e Objetivos',
    icon: Target,
    keys: ['motivos_emagrecer', 'apoio_programa', 'dificuldade_emagrecimento'],
  },
];

// ── Helper: pretty-print a value ─────────────────────────────────────────────
function formatLabel(raw: string): string {
  // Boolean translations
  const lower = raw.toLowerCase().trim();
  if (lower === 'false' || lower === 'nao' || lower === 'não') return 'Não';
  if (lower === 'true' || lower === 'sim') return 'Sim';
  // Replace underscores, capitalize first letter of each word
  return raw
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (Array.isArray(value)) return value.map(v => formatLabel(String(v))).join(', ');
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if ('altura' in obj && 'peso' in obj) return `${obj.altura} cm / ${obj.peso} kg`;
    return JSON.stringify(obj);
  }
  return formatLabel(String(value));
}

// ── Sub-component: one response row ──────────────────────────────────────────
function ResponseRow({ label, value, riskFlag }: { label: string; value: unknown; riskFlag: boolean }) {
  const display = displayValue(value);
  if (display === '—') return null;

  return (
    <div className={cn(
      'py-3 px-4 rounded-lg border',
      riskFlag
        ? 'bg-destructive/5 border-destructive/30'
        : 'bg-background border-border/30'
    )}>
      <dt className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
        {riskFlag && <AlertTriangle className="h-3 w-3 text-destructive flex-shrink-0" />}
        {label}
      </dt>
      <dd className={cn(
        'text-sm font-medium',
        riskFlag ? 'text-destructive' : 'text-foreground'
      )}>
        {display}
      </dd>
    </div>
  );
}

// ── Sub-component: collapsible section ───────────────────────────────────────
function SectionBlock({
  section,
  responses,
}: {
  section: Section;
  responses: Record<string, unknown>;
}) {
  const [open, setOpen] = useState(true);
  const Icon = section.icon;

  const rows = section.keys
    .filter(k => responses[k] !== undefined && responses[k] !== null && responses[k] !== '')
    .map(k => ({ key: k, value: responses[k], risk: isRisk(k, responses[k]) }));

  const hasRisk = rows.some(r => r.risk);

  if (rows.length === 0) return null;

  return (
    <div className="border border-border/50 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <h4 className="font-serif text-sm font-semibold text-foreground flex-1 text-left">
          {section.title}
        </h4>
        {hasRisk && (
          <span className="flex items-center gap-1 text-xs text-destructive font-medium mr-2">
            <AlertTriangle className="h-3 w-3" />
            Risco
          </span>
        )}
        <span className="text-xs text-muted-foreground mr-1">{rows.length} itens</span>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {rows.map(r => (
            <ResponseRow
              key={r.key}
              label={questionLabels[r.key] || r.key.replace(/_/g, ' ')}
              value={r.value}
              riskFlag={r.risk}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export function ClinicalDossier({
  evaluation,
  open,
  onClose,
  onUpdateStatus,
}: ClinicalDossierProps) {
  const [adjustNote, setAdjustNote] = useState('');
  const [showNoteField, setShowNoteField] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  if (!evaluation) return null;

  const status = statusConfig[evaluation.status] || statusConfig.pendente;
  const StatusIcon = status.icon;
  const responses = evaluation.respostas as Record<string, unknown>;

  // Keys already mapped in sections
  const mappedKeys = new Set(sections.flatMap(s => s.keys));
  const otherEntries = Object.entries(responses).filter(([k]) => !mappedKeys.has(k));

  async function handleAction(newStatus: string, note?: string) {
    if (!onUpdateStatus) return;
    setLoading(newStatus);
    await onUpdateStatus(evaluation!.id, newStatus, note);
    setLoading(null);
    setShowNoteField(false);
    setAdjustNote('');
  }

  const isPending = evaluation.status === 'pendente';

  return (
    <Sheet open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl p-0 border-l border-border/60 flex flex-col">

        {/* ── Header ── */}
        <header className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-border/60 bg-card">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                <User className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-semibold text-foreground leading-tight">
                  {evaluation.patient_name || 'Nome não disponível'}
                </h2>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(evaluation.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                  {evaluation.imc && (
                    <span className="flex items-center gap-1">
                      <Scale className="h-3 w-3" />
                      IMC: <strong>{evaluation.imc.toFixed(1)}</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 flex-shrink-0 mt-0.5">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-3">
            <Badge variant="outline" className={cn('px-3 py-1 text-xs font-medium', status.className)}>
              <StatusIcon className="h-3 w-3 mr-1.5" />
              {status.label}
            </Badge>
          </div>
        </header>

        {/* ── Scrollable body ── */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-6 space-y-5">

            {/* ── IMC indicator ── */}
            {evaluation.imc && (
              <div className={cn(
                'flex items-center gap-3 p-4 rounded-xl border text-sm',
                evaluation.imc >= 30
                  ? 'bg-destructive/5 border-destructive/30 text-destructive'
                  : evaluation.imc >= 25
                  ? 'bg-warning/10 border-warning/30 text-warning-foreground'
                  : 'bg-primary/5 border-primary/20 text-foreground'
              )}>
                <Scale className="h-4 w-4 flex-shrink-0" />
                <div>
                  <span className="font-semibold">IMC {evaluation.imc.toFixed(1)}</span>
                  {' — '}
                  {evaluation.imc >= 40 ? 'Obesidade Grau III (Mórbida)'
                    : evaluation.imc >= 35 ? 'Obesidade Grau II'
                    : evaluation.imc >= 30 ? 'Obesidade Grau I'
                    : evaluation.imc >= 25 ? 'Sobrepeso'
                    : 'Peso Normal'}
                </div>
              </div>
            )}

            <Separator />

            {/* ── Grouped sections ── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                  Dossiê Clínico
                </h3>
              </div>
              {sections.map(section => (
                <SectionBlock
                  key={section.id}
                  section={section}
                  responses={responses}
                />
              ))}

              {/* Other unmapped keys */}
              {otherEntries.length > 0 && (
                <div className="border border-border/50 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-3 px-5 py-4 bg-muted/30">
                    <h4 className="font-serif text-sm font-semibold text-foreground">Outros campos</h4>
                  </div>
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {otherEntries.map(([key, value]) => (
                      <ResponseRow
                        key={key}
                        label={questionLabels[key] || key.replace(/_/g, ' ')}
                        value={value}
                        riskFlag={isRisk(key, value)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* ── Fixed Action Bar ── */}
        {isPending && onUpdateStatus && (
          <div className="flex-shrink-0 border-t border-border/60 bg-card px-6 py-4 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
              Centro de Decisão Clínica
            </p>

            {/* Note field for adjustment */}
            {showNoteField && (
              <div className="space-y-2">
                <Textarea
                  value={adjustNote}
                  onChange={e => setAdjustNote(e.target.value)}
                  placeholder="Redija a nota de orientação que aparecerá no dashboard do paciente…"
                  className="text-sm min-h-[80px] resize-none"
                />
              </div>
            )}

            <div className="flex gap-2 flex-wrap">
              {/* Approve */}
              <Button
                size="sm"
                className="gap-1.5 flex-1 min-w-[100px] bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => handleAction('aprovado')}
                disabled={loading !== null}
              >
                <CheckCircle className="h-4 w-4" />
                {loading === 'aprovado' ? 'Aprovando…' : 'Aprovar Tratamento'}
              </Button>

              {/* Request adjustment */}
              {!showNoteField ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 flex-1 min-w-[100px]"
                  onClick={() => setShowNoteField(true)}
                  disabled={loading !== null}
                >
                  <AlertCircle className="h-4 w-4" />
                  Solicitar Ajuste
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 flex-1 min-w-[100px]"
                  onClick={() => handleAction('ajuste', adjustNote)}
                  disabled={loading !== null || !adjustNote.trim()}
                >
                  <AlertCircle className="h-4 w-4" />
                  {loading === 'ajuste' ? 'Enviando…' : 'Enviar Ajuste'}
                </Button>
              )}

              {/* Reject */}
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 flex-1 min-w-[100px] border-destructive/50 text-destructive hover:bg-destructive/5"
                onClick={() => handleAction('rejeitado')}
                disabled={loading !== null}
              >
                <XCircle className="h-4 w-4" />
                {loading === 'rejeitado' ? 'Rejeitando…' : 'Rejeitar'}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
