import { format } from 'date-fns';
import { User, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AtendimentoAvaliacao } from '@/pages/admin/AdminAtendimento';

const statusBadges: Record<string, { label: string; className: string }> = {
  pendente: { label: 'Pendente', className: 'bg-amber-100 text-amber-800' },
  aprovado: { label: 'Aprovado', className: 'bg-emerald-100 text-emerald-800' },
  ajuste: { label: 'Ajuste', className: 'bg-blue-100 text-blue-800' },
  bloqueado: { label: 'Bloqueado', className: 'bg-red-100 text-red-800' },
  aguardando_pagamento: { label: 'Aguard. Pagto', className: 'bg-violet-100 text-violet-800' },
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
  const birth = avaliacao.respostas?.data_nascimento as string | undefined;
  const birthFormatted = birth && !isNaN(new Date(birth).getTime())
    ? format(new Date(birth), 'dd/MM/yyyy')
    : null;

  const metaParts: string[] = [];
  if (birthFormatted) metaParts.push(birthFormatted);
  if (age !== null) metaParts.push(`${age} anos`);

  return (
    <div className="border border-border rounded-xl p-4 bg-card shadow-sm mb-3">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <User className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <h3
              className="text-sm font-semibold text-foreground flex-1 min-w-0"
              style={{ wordBreak: 'break-word' }}
            >
              {avaliacao.patient_name}
            </h3>
            <span
              className={cn(
                'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 whitespace-nowrap',
                badge.className,
              )}
            >
              {badge.label}
            </span>
          </div>
          {metaParts.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {metaParts.join(' · ')}
            </p>
          )}
          {avaliacao.imc != null && (
            <p className="text-xs text-muted-foreground mt-0.5">
              IMC: {avaliacao.imc.toFixed(1)}
            </p>
          )}
        </div>
      </div>

      <Button
        variant="outline"
        onClick={onViewAnamnese}
        className="w-full mt-3 h-11 gap-1.5"
      >
        <Eye className="h-4 w-4" />
        Ver Anamnese
      </Button>
    </div>
  );
}
