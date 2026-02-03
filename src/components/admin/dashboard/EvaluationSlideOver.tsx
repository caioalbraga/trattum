import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { X, CheckCircle, AlertCircle, XCircle, User, Scale, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Evaluation } from './EvaluationsTable';

interface EvaluationSlideOverProps {
  evaluation: Evaluation | null;
  open: boolean;
  onClose: () => void;
  onUpdateStatus?: (id: string, status: string) => Promise<void>;
}

const statusConfig: Record<string, { label: string; className: string; icon: typeof CheckCircle }> = {
  pendente: { 
    label: 'Pendente', 
    className: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: AlertCircle
  },
  aprovado: { 
    label: 'Aprovado', 
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: CheckCircle
  },
  ajuste: { 
    label: 'Ajuste Necessário', 
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: AlertCircle
  },
  rejeitado: { 
    label: 'Rejeitado', 
    className: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle
  },
};

// Question labels for better display
const questionLabels: Record<string, string> = {
  sexo: 'Sexo biológico',
  idade: 'Idade',
  altura: 'Altura (cm)',
  peso: 'Peso atual (kg)',
  objetivo_peso: 'Peso objetivo (kg)',
  motivacao: 'Motivação principal',
  tentativas_anteriores: 'Tentativas anteriores',
  condicoes_medicas: 'Condições médicas',
  medicamentos: 'Medicamentos em uso',
  alergias: 'Alergias',
  cirurgias: 'Cirurgias anteriores',
  habitos_alimentares: 'Hábitos alimentares',
  atividade_fisica: 'Nível de atividade física',
  sono: 'Qualidade do sono',
  estresse: 'Nível de estresse',
  consumo_alcool: 'Consumo de álcool',
  tabagismo: 'Tabagismo',
  // Add more as needed
};

export function EvaluationSlideOver({ 
  evaluation, 
  open, 
  onClose,
  onUpdateStatus 
}: EvaluationSlideOverProps) {
  if (!evaluation) return null;

  const status = statusConfig[evaluation.status] || statusConfig.pendente;
  const StatusIcon = status.icon;
  const responses = evaluation.respostas as Record<string, unknown>;

  const handleStatusChange = async (newStatus: string) => {
    if (onUpdateStatus) {
      await onUpdateStatus(evaluation.id, newStatus);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-full sm:max-w-xl p-0 border-l border-border/60">
        <SheetHeader className="px-6 py-5 border-b border-border/60 bg-card">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-serif text-xl">
              Detalhes da Avaliação
            </SheetTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Patient Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                  <User className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {evaluation.patient_name || 'Nome não disponível'}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(new Date(evaluation.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                    {evaluation.imc && (
                      <span className="flex items-center gap-1">
                        <Scale className="h-3.5 w-3.5" />
                        IMC: {evaluation.imc.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={cn("px-3 py-1 text-sm font-medium", status.className)}
                >
                  <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
                  {status.label}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Quick Actions */}
            {evaluation.status === 'pendente' && onUpdateStatus && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Ações Rápidas
                </h4>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => handleStatusChange('aprovado')}
                  >
                    <CheckCircle className="h-4 w-4 mr-1.5" />
                    Aprovar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                    onClick={() => handleStatusChange('ajuste')}
                  >
                    <AlertCircle className="h-4 w-4 mr-1.5" />
                    Solicitar Ajuste
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-50"
                    onClick={() => handleStatusChange('rejeitado')}
                  >
                    <XCircle className="h-4 w-4 mr-1.5" />
                    Rejeitar
                  </Button>
                </div>
              </div>
            )}

            <Separator />

            {/* Responses */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Respostas do Questionário
              </h4>
              
              <div className="space-y-3">
                {Object.entries(responses).map(([key, value]) => {
                  const label = questionLabels[key] || key.replace(/_/g, ' ');
                  const displayValue = Array.isArray(value) 
                    ? value.join(', ') 
                    : typeof value === 'object' 
                      ? JSON.stringify(value) 
                      : String(value);

                  return (
                    <div 
                      key={key} 
                      className="py-3 border-b border-border/40 last:border-0"
                    >
                      <dt className="text-sm text-muted-foreground capitalize mb-1">
                        {label}
                      </dt>
                      <dd className="text-sm font-medium text-foreground">
                        {displayValue || '—'}
                      </dd>
                    </div>
                  );
                })}
              </div>

              {Object.keys(responses).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma resposta registrada.
                </p>
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
