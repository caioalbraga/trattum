import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight } from 'lucide-react';

export interface Evaluation {
  id: string;
  user_id: string;
  patient_name: string;
  imc: number | null;
  status: string;
  created_at: string;
  respostas: Record<string, unknown>;
}

interface EvaluationsTableProps {
  evaluations: Evaluation[];
  loading?: boolean;
  onSelectEvaluation: (evaluation: Evaluation) => void;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pendente: { 
    label: 'Pendente', 
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' 
  },
  aprovado: { 
    label: 'Aprovado', 
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' 
  },
  ajuste: { 
    label: 'Ajuste Necessário', 
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' 
  },
  rejeitado: { 
    label: 'Rejeitado', 
    className: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' 
  },
};

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border border-border/40 rounded-lg">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-16 ml-auto" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-5 w-24" />
        </div>
      ))}
    </div>
  );
}

export function EvaluationsTable({ 
  evaluations, 
  loading = false,
  onSelectEvaluation 
}: EvaluationsTableProps) {
  if (loading) {
    return <TableSkeleton />;
  }

  if (evaluations.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Nenhuma avaliação encontrada.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[1fr,80px,140px,120px,32px] gap-4 px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border/60">
        <span>Paciente</span>
        <span className="text-right">IMC</span>
        <span>Status</span>
        <span>Data</span>
        <span></span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-border/40">
        {evaluations.map((evaluation) => {
          const status = statusConfig[evaluation.status] || statusConfig.pendente;
          
          return (
            <button
              key={evaluation.id}
              onClick={() => onSelectEvaluation(evaluation)}
              className={cn(
                "w-full grid grid-cols-[1fr,80px,140px,120px,32px] gap-4 px-4 py-4 text-left",
                "hover:bg-muted/50 transition-colors duration-150",
                "focus:outline-none focus:bg-muted/50",
                "group"
              )}
            >
              <span className="font-medium text-foreground truncate">
                {evaluation.patient_name || 'Nome não disponível'}
              </span>
              
              <span className="text-right font-mono text-sm text-muted-foreground">
                {evaluation.imc ? evaluation.imc.toFixed(1) : '—'}
              </span>
              
              <span>
                <span className={cn(
                  "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
                  status.className
                )}>
                  {status.label}
                </span>
              </span>
              
              <span className="text-sm text-muted-foreground">
                {format(new Date(evaluation.created_at), "dd MMM yyyy", { locale: ptBR })}
              </span>

              <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
