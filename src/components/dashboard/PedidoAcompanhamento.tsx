import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, Circle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  PATIENT_STAGES, PATIENT_STATUS_LABEL, PedidoStatus, getPatientStageIndex,
} from '@/lib/pedidos-status';

interface PedidoMin {
  id: string;
  status: PedidoStatus;
  paciente_id: string;
}

export function PedidoAcompanhamento() {
  const { user } = useAuth();
  const [pedido, setPedido] = useState<PedidoMin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!profile) { setLoading(false); return; }

      const { data } = await supabase
        .from('pedidos')
        .select('id, status, paciente_id')
        .eq('paciente_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setPedido(data as PedidoMin | null);
      setLoading(false);

      // Realtime: listen for updates on this patient's orders
      channel = supabase
        .channel(`pedidos-${profile.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'pedidos',
          filter: `paciente_id=eq.${profile.id}`,
        }, (payload) => {
          const row = (payload.new ?? payload.old) as PedidoMin | undefined;
          if (row) setPedido({ id: row.id, status: row.status, paciente_id: row.paciente_id });
        })
        .subscribe();
    })();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [user]);

  if (loading || !pedido) return null;

  const isProblem = pedido.status === 'problema';
  const currentIdx = getPatientStageIndex(pedido.status);

  return (
    <Card className="card-elevated">
      <CardHeader>
        <CardTitle className="font-serif text-xl">Acompanhamento do pedido</CardTitle>
        <CardDescription>{PATIENT_STATUS_LABEL[pedido.status]}</CardDescription>
      </CardHeader>
      <CardContent>
        {isProblem ? (
          <div className="flex items-start gap-3 p-4 rounded-lg border border-destructive/40 bg-destructive/5">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Atenção — entraremos em contato</p>
              <p className="text-sm text-muted-foreground mt-1">
                Identificamos um ponto que precisa de atenção no seu pedido. Nossa equipe entrará em contato em breve.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-1">
            {PATIENT_STAGES.map((stage, idx) => {
              const isDone = currentIdx > idx;
              const isCurrent = currentIdx === idx;
              const isLast = idx === PATIENT_STAGES.length - 1;
              return (
                <div key={stage.key} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-2">
                    <div className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all',
                      isDone && 'bg-primary text-primary-foreground',
                      isCurrent && 'bg-primary text-primary-foreground ring-[3px] ring-primary/20',
                      !isDone && !isCurrent && 'bg-muted text-muted-foreground/50 border border-border',
                    )}>
                      {isDone ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-3 w-3" />}
                    </div>
                    <span className={cn(
                      'text-[10px] font-medium text-center leading-tight w-16',
                      (isDone || isCurrent) ? 'text-foreground' : 'text-muted-foreground/60',
                      isCurrent && 'font-semibold',
                    )}>
                      {stage.label}
                    </span>
                  </div>
                  {!isLast && (
                    <div className="flex-1 h-[2px] mx-1 mt-[-20px]">
                      <div className={cn(
                        'h-full rounded-full transition-colors',
                        isDone ? 'bg-primary' : 'bg-border',
                      )} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
