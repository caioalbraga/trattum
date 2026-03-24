import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { X, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AtendimentoAvaliacao } from '@/pages/admin/AdminAtendimento';

const anamneseFields = [
  { key: 'medicamentos', label: 'Medicamentos em uso' },
  { key: 'historico_familiar', label: 'Histórico familiar' },
  { key: 'cirurgias', label: 'Cirurgias prévias' },
  { key: 'gestacional', label: 'Histórico gestacional' },
  { key: 'nutricional', label: 'Acompanhamento nutricional' },
  { key: 'atividade_fisica', label: 'Atividade física' },
  { key: 'medidas', label: 'Medidas corporais' },
  { key: 'foto_frente', label: 'Foto - Frente' },
  { key: 'foto_lateral', label: 'Foto - Lateral' },
  { key: 'foto_costas', label: 'Foto - Costas' },
];

interface Props {
  avaliacao: AtendimentoAvaliacao;
  onClose: () => void;
  onSubmitted: () => Promise<void>;
}

interface FieldAdjustment {
  field: string;
  reason: string;
}

export function AdjustmentDrawer({ avaliacao, onClose, onSubmitted }: Props) {
  const [ajusteAnamnese, setAjusteAnamnese] = useState(false);
  const [ajusteEnvio, setAjusteEnvio] = useState(false);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  const [fieldReasons, setFieldReasons] = useState<Record<string, string>>({});
  const [envioReason, setEnvioReason] = useState('');
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const toggleField = (key: string) => {
    const next = new Set(selectedFields);
    if (next.has(key)) {
      next.delete(key);
      const reasons = { ...fieldReasons };
      delete reasons[key];
      setFieldReasons(reasons);
    } else {
      next.add(key);
    }
    setSelectedFields(next);
  };

  const updateFieldReason = (key: string, value: string) => {
    setFieldReasons(prev => ({ ...prev, [key]: value }));
  };

  // Validation
  const anamneseValid = !ajusteAnamnese || (
    selectedFields.size > 0 &&
    Array.from(selectedFields).every(k => fieldReasons[k]?.trim())
  );
  const envioValid = !ajusteEnvio || envioReason.trim().length > 0;
  const hasAtLeastOne = ajusteAnamnese || ajusteEnvio;
  const canSubmit = hasAtLeastOne && anamneseValid && envioValid;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSending(true);

    try {
      const { data: { user: adminUser } } = await supabase.auth.getUser();

      const campos: FieldAdjustment[] = [];

      if (ajusteAnamnese) {
        Array.from(selectedFields).forEach(field => {
          campos.push({ field, reason: fieldReasons[field] || '' });
        });
      }

      // Build message
      const parts: string[] = [];
      if (ajusteAnamnese) {
        parts.push('Ajuste(s) na Anamnese:');
        campos.forEach(c => {
          const label = anamneseFields.find(f => f.key === c.field)?.label || c.field;
          parts.push(`• ${label}: ${c.reason}`);
        });
      }
      if (ajusteEnvio) {
        parts.push('Ajuste em Informações de Envio:');
        parts.push(envioReason);
      }

      const mensagem = parts.join('\n');
      const tipoAjuste = ajusteEnvio && !ajusteAnamnese ? 'envio' : 'anamnese';

      // Insert ajuste_clinico
      await supabase.from('ajustes_clinicos').insert({
        avaliacao_id: avaliacao.id,
        user_id: avaliacao.user_id,
        autor: 'medico',
        mensagem,
        criado_por: adminUser?.id,
        tipo_ajuste: tipoAjuste,
        campos_ajuste: campos,
      } as any);

      // Update avaliacao status (envio stays approved)
      if (tipoAjuste === 'anamnese') {
        await supabase.from('avaliacoes').update({ status: 'ajuste' }).eq('id', avaliacao.id);
      }

      // Notify patient
      await supabase.from('notificacoes').insert({
        user_id: avaliacao.user_id,
        avaliacao_id: avaliacao.id,
        tipo: 'ajuste',
        titulo: tipoAjuste === 'envio' ? 'Ajuste de Informações de Envio' : 'Ajuste Solicitado pela Equipe Médica',
        mensagem,
      });

      toast({ title: 'Ajuste solicitado', description: 'O paciente foi notificado.' });
      await onSubmitted();
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Erro ao solicitar ajuste' });
    } finally {
      setSending(false);
    }
  };

  // Hide gestacional if patient is male
  const isFemale = String(avaliacao.respostas?.sexo || '').toLowerCase() === 'feminino';
  const visibleFields = anamneseFields.filter(f => f.key !== 'gestacional' || isFemale);

  return (
    <div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
      <header className="flex-shrink-0 px-6 py-4 border-b border-border/60 flex items-center justify-between">
        <h3 className="font-serif text-lg font-semibold text-foreground">Solicitar Ajuste</h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </header>

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-6 space-y-6">

          {/* Type 1: Ajuste na Anamnese */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={ajusteAnamnese}
                onCheckedChange={(checked) => {
                  setAjusteAnamnese(!!checked);
                  if (!checked) {
                    setSelectedFields(new Set());
                    setFieldReasons({});
                  }
                }}
              />
              <span className="text-sm font-medium text-foreground">Ajuste na Anamnese</span>
            </div>

            {ajusteAnamnese && (
              <div className="ml-7 space-y-3">
                {visibleFields.map(field => (
                  <div key={field.key} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedFields.has(field.key)}
                        onCheckedChange={() => toggleField(field.key)}
                      />
                      <span className="text-sm text-foreground">{field.label}</span>
                    </div>
                    {selectedFields.has(field.key) && (
                      <div className="ml-7">
                        <Textarea
                          value={fieldReasons[field.key] || ''}
                          onChange={e => updateFieldReason(field.key, e.target.value)}
                          placeholder="Explique o motivo do ajuste..."
                          className="text-sm min-h-[60px] resize-none"
                        />
                        {!fieldReasons[field.key]?.trim() && (
                          <p className="text-xs text-destructive mt-1">Campo obrigatório</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Type 2: Ajuste em Informações de Envio */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={ajusteEnvio}
                onCheckedChange={(checked) => {
                  setAjusteEnvio(!!checked);
                  if (!checked) setEnvioReason('');
                }}
              />
              <span className="text-sm font-medium text-foreground">Ajuste em Informações de Envio</span>
            </div>

            {ajusteEnvio && (
              <div className="ml-7">
                <Textarea
                  value={envioReason}
                  onChange={e => setEnvioReason(e.target.value)}
                  placeholder="Descreva o que precisa ser ajustado..."
                  className="text-sm min-h-[80px] resize-none"
                />
                {!envioReason.trim() && (
                  <p className="text-xs text-destructive mt-1">Campo obrigatório</p>
                )}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      <footer className="flex-shrink-0 border-t border-border/60 bg-card px-6 py-4">
        <div className="flex gap-3 justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!canSubmit || sending}
            className="gap-1.5"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {sending ? 'Enviando…' : 'Confirmar Ajuste'}
          </Button>
        </div>
      </footer>
    </div>
  );
}
