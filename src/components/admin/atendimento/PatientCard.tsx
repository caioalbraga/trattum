import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { User, Scale, Calendar, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AtendimentoAvaliacao } from '@/pages/admin/AdminAtendimento';

const statusBadges: Record<string, { label: string; className: string }> = {
  pendente: { label: 'Pendente', className: 'bg-amber-100 text-amber-800' },
  aprovado: { label: 'Aprovado', className: 'bg-emerald-100 text-emerald-800' },
  ajuste: { label: 'Ajuste Necessário', className: 'bg-blue-100 text-blue-800' },
  bloqueado: { label: 'Bloqueado', className: 'bg-red-100 text-red-800' },
  aguardando_pagamento: { label: 'Aguardando Pagamento', className: 'bg-violet-100 text-violet-800' },
  rejeitado: { label: 'Rejeitado', className: 'bg-red-100 text-red-800' },
};

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

interface Props {
  avaliacao: AtendimentoAvaliacao;
  onViewAnamnese: () => void;
}

export function AtendimentoPatientCard({ avaliacao, onViewAnamnese }: Props) {
  const badge = statusBadges[avaliacao.status] || statusBadges.pendente;
  const age = calculateAge(avaliacao.respostas?.data_nascimento as string | undefined);

  return (
    <div className="bg-card border border-border/60 rounded-xl p-5 flex items-center gap-4 hover:shadow-sm transition-shadow">
      <div className="h-11 w-11 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
        <User className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <h3 className="font-semibold text-foreground truncate">
            {avaliacao.patient_name}
          </h3>
          <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', badge.className)}>
            {badge.label}
          </span>
        </div>
        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
          {age !== null && (
            <span>{age} anos</span>
          )}
          {avaliacao.imc && (
            <span className="flex items-center gap-1">
              <Scale className="h-3 w-3" />
              IMC {avaliacao.imc.toFixed(1)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(avaliacao.created_at), "dd MMM yyyy", { locale: ptBR })}
          </span>
        </div>
      </div>

      <Button variant="outline" size="sm" onClick={onViewAnamnese} className="gap-1.5 flex-shrink-0">
        <Eye className="h-4 w-4" />
        Ver Anamnese
      </Button>
    </div>
  );
}
