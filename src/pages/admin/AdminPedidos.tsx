import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { decryptProfiles } from '@/lib/crypto-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Search, Loader2, AlertTriangle, PackageSearch, Pencil, Clock } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  PEDIDO_STATUS_VALUES, PedidoStatus, STAFF_STATUS_META,
} from '@/lib/pedidos-status';

interface PedidoOperacional {
  id: string;
  paciente_id: string;
  pedido_legacy_id: string | null;
  medicamento: string | null;
  dosagem: string | null;
  observacoes: string | null;
  status: PedidoStatus;
  created_at: string;
  updated_at: string;
}

interface ProfileLite {
  id: string;
  user_id: string;
  nome: string | null;
}

interface LogEntry {
  id: string;
  status_anterior: string | null;
  status_novo: string;
  alterado_em: string;
  alterado_por: string | null;
  observacao: string | null;
  alterado_por_nome?: string | null;
}

export default function AdminPedidos() {
  const { isAdmin, loading: authLoading, userRole } = useAdminAuth();
  const { toast } = useToast();

  const [pedidos, setPedidos] = useState<PedidoOperacional[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [logLoading, setLogLoading] = useState(false);

  // Modals
  const [confirmRealizadoOpen, setConfirmRealizadoOpen] = useState(false);
  const [obsRealizado, setObsRealizado] = useState('');
  const [editMedOpen, setEditMedOpen] = useState(false);
  const [editMed, setEditMed] = useState({ medicamento: '', dosagem: '', observacoes: '' });
  const [testStatus, setTestStatus] = useState<PedidoStatus>('aguardando_pedido');
  const [busy, setBusy] = useState(false);

  const canAccess = userRole === 'admin' || userRole === 'medico' || userRole === 'assistente';

  useEffect(() => {
    if (isAdmin && canAccess) fetchPedidos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, canAccess]);

  const fetchPedidos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      const list = (data ?? []) as PedidoOperacional[];
      setPedidos(list);

      // Fetch related profiles
      const ids = Array.from(new Set(list.map((p) => p.paciente_id)));
      if (ids.length) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, user_id, nome')
          .in('id', ids);
        const decrypted = await decryptProfiles((profs ?? []) as ProfileLite[]);
        const map: Record<string, ProfileLite> = {};
        decrypted.forEach((p) => { map[p.id] = p; });
        setProfiles(map);
      }
    } catch (e) {
      console.error(e);
      toast({ title: 'Erro ao carregar pedidos', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedId) { setLog([]); return; }
    fetchLog(selectedId);
  }, [selectedId]);

  const fetchLog = async (pedidoId: string) => {
    setLogLoading(true);
    try {
      const { data, error } = await supabase
        .from('pedidos_status_log')
        .select('*')
        .eq('pedido_id', pedidoId)
        .order('alterado_em', { ascending: false });
      if (error) throw error;

      // Resolve user names
      const userIds = Array.from(new Set((data ?? []).map((l) => l.alterado_por).filter(Boolean) as string[]));
      let nameMap: Record<string, string> = {};
      if (userIds.length) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('user_id, nome')
          .in('user_id', userIds);
        const decrypted = await decryptProfiles((profs ?? []) as ProfileLite[]);
        decrypted.forEach((p) => { if (p.user_id) nameMap[p.user_id] = p.nome ?? '—'; });
      }
      setLog((data ?? []).map((l) => ({
        ...l,
        alterado_por_nome: l.alterado_por ? nameMap[l.alterado_por] ?? 'Sistema' : 'Sistema',
      })) as LogEntry[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLogLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return pedidos.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (search) {
        const name = profiles[p.paciente_id]?.nome ?? '';
        if (!name.toLowerCase().includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [pedidos, statusFilter, search, profiles]);

  const selected = pedidos.find((p) => p.id === selectedId) ?? null;
  const selectedProfile = selected ? profiles[selected.paciente_id] : null;

  useEffect(() => {
    if (selected) {
      setTestStatus(selected.status);
      setEditMed({
        medicamento: selected.medicamento ?? '',
        dosagem: selected.dosagem ?? '',
        observacoes: selected.observacoes ?? '',
      });
    }
  }, [selected?.id]);

  const updateStatus = async (newStatus: PedidoStatus, observacao?: string) => {
    if (!selected) return;
    setBusy(true);
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ status: newStatus })
        .eq('id', selected.id);
      if (error) throw error;

      // If observation, attach it to the most recent log entry
      if (observacao) {
        const { data: latest } = await supabase
          .from('pedidos_status_log')
          .select('id')
          .eq('pedido_id', selected.id)
          .order('alterado_em', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (latest?.id) {
          await supabase.from('pedidos_status_log').update({ observacao } as any).eq('id', latest.id);
        }
      }

      toast({ title: 'Status atualizado' });
      await fetchPedidos();
      await fetchLog(selected.id);
    } catch (e: any) {
      toast({ title: 'Erro ao atualizar', description: e.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const handleMarcarRealizado = async () => {
    if (!obsRealizado.trim()) {
      toast({ title: 'Observação obrigatória', variant: 'destructive' });
      return;
    }
    await updateStatus('pedido_realizado', obsRealizado.trim());
    setConfirmRealizadoOpen(false);
    setObsRealizado('');
  };

  const handleSaveMed = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({
          medicamento: editMed.medicamento || null,
          dosagem: editMed.dosagem || null,
          observacoes: editMed.observacoes || null,
        })
        .eq('id', selected.id);
      if (error) throw error;
      toast({ title: 'Medicamento atualizado' });
      setEditMedOpen(false);
      await fetchPedidos();
    } catch (e: any) {
      toast({ title: 'Erro ao salvar', description: e.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  if (authLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!canAccess) {
    return (
      <AdminLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Acesso restrito.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-3xl font-bold">Pedidos</h1>
          <p className="text-muted-foreground">
            Controle operacional de medicamentos enviados aos pacientes.
          </p>
        </div>

        <div className="grid lg:grid-cols-[400px_1fr] gap-6">
          {/* Coluna esquerda — lista */}
          <Card className="h-fit">
            <CardHeader className="pb-3 space-y-3">
              <CardTitle className="font-serif text-lg">Lista de pedidos</CardTitle>
              <div className="flex flex-col gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    {PEDIDO_STATUS_VALUES.map((s) => (
                      <SelectItem key={s} value={s}>{STAFF_STATUS_META[s].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome do paciente"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-2 max-h-[70vh] overflow-y-auto space-y-2">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-sm text-muted-foreground">
                  <PackageSearch className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  Nenhum pedido até o momento
                </div>
              ) : (
                filtered.map((p) => {
                  const meta = STAFF_STATUS_META[p.status];
                  const name = profiles[p.paciente_id]?.nome ?? '—';
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedId(p.id)}
                      className={cn(
                        'w-full text-left p-3 rounded-lg border transition-colors',
                        selectedId === p.id
                          ? 'bg-primary/5 border-primary/40'
                          : 'border-border/40 hover:bg-muted/40',
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{name}</p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {p.medicamento ?? '—'}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(p.created_at), { addSuffix: true, locale: ptBR })}
                          </p>
                        </div>
                        <Badge variant="outline" className={cn('shrink-0 text-[10px]', meta.badgeClass)}>
                          {meta.label}
                        </Badge>
                      </div>
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Coluna direita — detalhe */}
          <div>
            {!selected ? (
              <Card>
                <CardContent className="py-24 text-center text-muted-foreground">
                  Selecione um pedido à esquerda
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Cabeçalho */}
                <Card>
                  <CardContent className="pt-6 flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Paciente</p>
                      <h2 className="font-serif text-2xl font-semibold">
                        {selectedProfile?.nome ?? '—'}
                      </h2>
                    </div>
                    <Badge variant="outline" className={cn('text-sm py-1.5 px-3', STAFF_STATUS_META[selected.status].badgeClass)}>
                      {STAFF_STATUS_META[selected.status].label}
                    </Badge>
                  </CardContent>
                </Card>

                {/* Medicamento */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-base">Medicamento</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setEditMedOpen(true)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div><span className="text-muted-foreground">Medicamento: </span>{selected.medicamento ?? '—'}</div>
                    <div><span className="text-muted-foreground">Dosagem: </span>{selected.dosagem ?? '—'}</div>
                    <div><span className="text-muted-foreground">Observações: </span>{selected.observacoes ?? '—'}</div>
                  </CardContent>
                </Card>

                {/* Ações */}
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-base">Ações</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      onClick={() => setConfirmRealizadoOpen(true)}
                      disabled={selected.status !== 'aguardando_pedido' || busy}
                      className="w-full sm:w-auto"
                    >
                      Marcar pedido realizado
                    </Button>

                    <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-4 space-y-3">
                      <div className="flex items-start gap-2 text-amber-900 dark:text-amber-200">
                        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                        <p className="text-xs">
                          <strong>Modo teste — apenas para validação de sincronização.</strong>{' '}
                          Em produção, mudanças de status serão automáticas.
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Select value={testStatus} onValueChange={(v) => setTestStatus(v as PedidoStatus)}>
                          <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {PEDIDO_STATUS_VALUES.map((s) => (
                              <SelectItem key={s} value={s}>{STAFF_STATUS_META[s].label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="secondary"
                          disabled={busy || testStatus === selected.status}
                          onClick={() => updateStatus(testStatus)}
                        >
                          Atualizar status
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Linha do tempo */}
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" /> Linha do tempo</CardTitle></CardHeader>
                  <CardContent>
                    {logLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : log.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Sem registros.</p>
                    ) : (
                      <ol className="space-y-3">
                        {log.map((entry) => (
                          <li key={entry.id} className="border-l-2 border-primary/30 pl-3 py-1">
                            <p className="text-sm font-medium">
                              {entry.status_anterior
                                ? `${STAFF_STATUS_META[entry.status_anterior as PedidoStatus]?.label ?? entry.status_anterior} → ${STAFF_STATUS_META[entry.status_novo as PedidoStatus]?.label ?? entry.status_novo}`
                                : `Criado como ${STAFF_STATUS_META[entry.status_novo as PedidoStatus]?.label ?? entry.status_novo}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(entry.alterado_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              {' · '}{entry.alterado_por_nome ?? 'Sistema'}
                            </p>
                            {entry.observacao && (
                              <p className="text-xs mt-1 italic text-muted-foreground">"{entry.observacao}"</p>
                            )}
                          </li>
                        ))}
                      </ol>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialog: marcar realizado */}
      <Dialog open={confirmRealizadoOpen} onOpenChange={setConfirmRealizadoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar pedido como realizado</DialogTitle>
            <DialogDescription>Descreva como o pedido foi feito (obrigatório).</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Ex.: Pedido enviado por WhatsApp à Farmácia X"
            value={obsRealizado}
            onChange={(e) => setObsRealizado(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRealizadoOpen(false)}>Cancelar</Button>
            <Button onClick={handleMarcarRealizado} disabled={busy}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: editar medicamento */}
      <Dialog open={editMedOpen} onOpenChange={setEditMedOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar medicamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Medicamento</Label>
              <Input value={editMed.medicamento} onChange={(e) => setEditMed({ ...editMed, medicamento: e.target.value })} />
            </div>
            <div>
              <Label>Dosagem</Label>
              <Input value={editMed.dosagem} onChange={(e) => setEditMed({ ...editMed, dosagem: e.target.value })} />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea rows={3} value={editMed.observacoes} onChange={(e) => setEditMed({ ...editMed, observacoes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditMedOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveMed} disabled={busy}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
