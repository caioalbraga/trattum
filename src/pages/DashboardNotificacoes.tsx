import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle, XCircle, AlertCircle, ArrowLeft, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Notificacao {
  id: string;
  avaliacao_id: string | null;
  tipo: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  created_at: string;
}

interface AjusteClinico {
  id: string;
  autor: string;
  mensagem: string;
  created_at: string;
}

const tipoConfig: Record<string, { icon: typeof CheckCircle; className: string }> = {
  aprovado:  { icon: CheckCircle,  className: 'text-emerald-600 bg-emerald-50' },
  rejeitado: { icon: XCircle,      className: 'text-destructive bg-destructive/5' },
  ajuste:    { icon: AlertCircle,   className: 'text-blue-600 bg-blue-50' },
};

export default function DashboardNotificacoes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Notificacao | null>(null);
  const [ajustes, setAjustes] = useState<AjusteClinico[]>([]);
  const [resposta, setResposta] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchNotificacoes();
  }, [user]);

  const fetchNotificacoes = async () => {
    const { data } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    setNotificacoes((data as Notificacao[]) || []);
    setLoading(false);
  };

  const openNotificacao = async (n: Notificacao) => {
    setSelected(n);

    // Mark as read
    if (!n.lida) {
      await supabase.from('notificacoes').update({ lida: true }).eq('id', n.id);
      setNotificacoes(prev => prev.map(x => x.id === n.id ? { ...x, lida: true } : x));
    }

    // If adjustment, load thread
    if (n.tipo === 'ajuste' && n.avaliacao_id) {
      const { data } = await supabase
        .from('ajustes_clinicos')
        .select('id, autor, mensagem, created_at')
        .eq('avaliacao_id', n.avaliacao_id)
        .order('created_at', { ascending: true });
      setAjustes((data as AjusteClinico[]) || []);
    } else {
      setAjustes([]);
    }
  };

  const sendResposta = async () => {
    if (!selected?.avaliacao_id || !resposta.trim() || !user) return;
    setSending(true);
    const { error } = await supabase.from('ajustes_clinicos').insert({
      avaliacao_id: selected.avaliacao_id,
      user_id: user.id,
      autor: 'paciente',
      mensagem: resposta.trim(),
    });
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao enviar resposta' });
    } else {
      toast({ title: 'Resposta enviada com sucesso!' });
      setResposta('');
      // Refresh thread
      const { data } = await supabase
        .from('ajustes_clinicos')
        .select('id, autor, mensagem, created_at')
        .eq('avaliacao_id', selected.avaliacao_id)
        .order('created_at', { ascending: true });
      setAjustes((data as AjusteClinico[]) || []);
    }
    setSending(false);
  };

  if (selected) {
    const cfg = tipoConfig[selected.tipo] || tipoConfig.ajuste;
    const Icon = cfg.icon;

    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <Button variant="ghost" size="sm" onClick={() => setSelected(null)} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>

          <div className="bg-card border border-border/60 rounded-xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className={cn('p-2 rounded-lg', cfg.className)}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h2 className="font-serif text-lg font-semibold text-foreground">{selected.titulo}</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(selected.created_at), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
            <p className="text-sm text-foreground leading-relaxed">{selected.mensagem}</p>
          </div>

          {/* Adjustment thread */}
          {selected.tipo === 'ajuste' && (
            <div className="space-y-4">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                Conversa com a Equipe Médica
              </h3>

              <div className="space-y-3">
                {ajustes.map(a => (
                  <div
                    key={a.id}
                    className={cn(
                      'max-w-[85%] p-4 rounded-xl text-sm',
                      a.autor === 'medico'
                        ? 'bg-muted/50 border border-border/50 self-start mr-auto'
                        : 'bg-primary/10 border border-primary/20 self-end ml-auto'
                    )}
                  >
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      {a.autor === 'medico' ? 'Equipe Médica' : 'Você'}
                      {' · '}
                      {format(new Date(a.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                    <p className="text-foreground">{a.mensagem}</p>
                  </div>
                ))}
              </div>

              {/* Reply field */}
              <div className="bg-card border border-border/60 rounded-xl p-4 space-y-3">
                <Textarea
                  value={resposta}
                  onChange={e => setResposta(e.target.value)}
                  placeholder="Escreva sua resposta aqui..."
                  className="text-sm min-h-[80px] resize-none"
                />
                <Button
                  size="sm"
                  onClick={sendResposta}
                  disabled={sending || !resposta.trim()}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  {sending ? 'Enviando…' : 'Enviar Resposta'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <header>
          <h1 className="font-serif text-2xl font-semibold text-foreground">Notificações</h1>
          <p className="text-muted-foreground text-sm mt-1">Acompanhe as atualizações do seu tratamento.</p>
        </header>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : notificacoes.length === 0 ? (
          <div className="bg-card border border-border/60 rounded-xl p-8 text-center text-muted-foreground text-sm">
            Nenhuma notificação no momento.
          </div>
        ) : (
          <div className="space-y-2">
            {notificacoes.map(n => {
              const cfg = tipoConfig[n.tipo] || tipoConfig.ajuste;
              const Icon = cfg.icon;
              return (
                <button
                  key={n.id}
                  onClick={() => openNotificacao(n)}
                  className={cn(
                    'w-full text-left bg-card border rounded-xl p-4 flex items-start gap-3 transition-colors hover:bg-muted/30',
                    !n.lida ? 'border-primary/30 bg-primary/[0.02]' : 'border-border/60'
                  )}
                >
                  <div className={cn('p-2 rounded-lg flex-shrink-0', cfg.className)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={cn('text-sm font-medium truncate', !n.lida && 'font-semibold')}>
                        {n.titulo}
                      </h3>
                      {!n.lida && (
                        <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">
                          Nova
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{n.mensagem}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(n.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
