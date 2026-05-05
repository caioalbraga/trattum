import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  Mail, Pencil, Send, RefreshCw, AlertTriangle, CheckCircle2, XCircle, Loader2, Copy,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EmailTemplate {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  gatilho: string;
  assunto: string;
  corpo_html: string;
  variaveis_disponiveis: string[];
  ativo: boolean;
  modo_teste: boolean;
  updated_at: string;
}

interface EmailLog {
  id: string;
  template_codigo: string;
  destinatario: string;
  assunto: string;
  status: 'enviado' | 'falhou' | 'em_rota';
  resend_id: string | null;
  erro: string | null;
  modo_teste: boolean;
  enviado_em: string;
}

function FragmentRow({ log: l, expanded, onToggle, templateName }: {
  log: EmailLog; expanded: boolean; onToggle: () => void; templateName: string;
}) {
  return (
    <>
      <TableRow className="cursor-pointer" onClick={onToggle}>
        <TableCell className="text-sm">
          {formatDistanceToNow(new Date(l.enviado_em), { addSuffix: true, locale: ptBR })}
        </TableCell>
        <TableCell className="text-sm">{templateName}</TableCell>
        <TableCell className="text-xs font-mono">{l.destinatario}</TableCell>
        <TableCell>
          {l.status === 'enviado' && <Badge className="bg-emerald-600"><CheckCircle2 className="h-3 w-3 mr-1" />Enviado</Badge>}
          {l.status === 'falhou' && <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Falhou</Badge>}
          {l.status === 'em_rota' && <Badge variant="secondary">Em rota</Badge>}
        </TableCell>
        <TableCell>{l.modo_teste && <Badge variant="outline">Teste</Badge>}</TableCell>
      </TableRow>
      {expanded && (
        <TableRow>
          <TableCell colSpan={5} className="bg-muted/40 text-xs font-mono">
            {l.erro && <div className="text-destructive whitespace-pre-wrap">Erro: {l.erro}</div>}
            {l.resend_id && <div>Resend ID: {l.resend_id}</div>}
            <div>Assunto: {l.assunto}</div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export function EmailsTab({ isAdmin }: { isAdmin: boolean }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [editDialog, setEditDialog] = useState(false);
  const [testing, setTesting] = useState<EmailTemplate | null>(null);
  const [testDialog, setTestDialog] = useState(false);
  const [testTarget, setTestTarget] = useState('');
  const [testVars, setTestVars] = useState<Record<string, string>>({});
  const [testSending, setTestSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: tpl }, { data: lg }] = await Promise.all([
      supabase.from('email_templates').select('*').order('nome'),
      supabase.from('email_log').select('*').order('enviado_em', { ascending: false }).limit(50),
    ]);
    setTemplates((tpl as EmailTemplate[]) || []);
    setLogs((lg as EmailLog[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const lastSent = logs[0]?.enviado_em;

  const openEdit = (t: EmailTemplate) => {
    setEditing({ ...t });
    setEditDialog(true);
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    const { error } = await supabase
      .from('email_templates')
      .update({
        assunto: editing.assunto,
        corpo_html: editing.corpo_html,
        ativo: editing.ativo,
        modo_teste: editing.modo_teste,
      })
      .eq('id', editing.id);
    setSaving(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: error.message });
      return;
    }
    toast({ title: 'Template atualizado' });
    setEditDialog(false);
    load();
  };

  const toggleAtivo = async (t: EmailTemplate, value: boolean) => {
    const { error } = await supabase.from('email_templates').update({ ativo: value }).eq('id', t.id);
    if (error) { toast({ variant: 'destructive', title: 'Erro' }); return; }
    setTemplates(p => p.map(x => x.id === t.id ? { ...x, ativo: value } : x));
  };

  const toggleModoTeste = async (t: EmailTemplate, value: boolean) => {
    const { error } = await supabase.from('email_templates').update({ modo_teste: value }).eq('id', t.id);
    if (error) { toast({ variant: 'destructive', title: 'Erro' }); return; }
    setTemplates(p => p.map(x => x.id === t.id ? { ...x, modo_teste: value } : x));
  };

  const openTest = (t: EmailTemplate) => {
    setTesting(t);
    setTestTarget(user?.email || '');
    const vars: Record<string, string> = {};
    t.variaveis_disponiveis.forEach(v => {
      const key = v.replace(/[{}]/g, '').trim();
      vars[key] = key === 'nome_paciente' ? (user?.email?.split('@')[0] || 'Paciente') :
                  key === 'link_pagamento' ? 'https://trattum.com/checkout' :
                  key === 'motivo' ? 'Exemplo de motivo' :
                  key === 'observacao' ? 'Exemplo de observação' : '';
    });
    setTestVars(vars);
    setTestDialog(true);
  };

  const sendTest = async () => {
    if (!testing || !testTarget) return;
    setTestSending(true);
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        template_codigo: testing.codigo,
        destinatario: testTarget,
        variaveis: testVars,
        forcar_modo_teste: true,
      },
    });
    setTestSending(false);
    if (error || !data?.success) {
      toast({ variant: 'destructive', title: 'Falha no envio', description: data?.error ? JSON.stringify(data.error) : error?.message });
    } else {
      toast({ title: 'E-mail de teste enviado!', description: testTarget });
      setTestDialog(false);
      load();
    }
  };

  const copyVar = (v: string) => {
    navigator.clipboard.writeText(v);
    toast({ title: 'Variável copiada', description: v });
  };

  const templateNameByCode = (code: string) => templates.find(t => t.codigo === code)?.nome || code;

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Status Resend */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif flex items-center gap-2">
              <Mail className="h-5 w-5" /> Status do envio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide">Domínio</p>
                <p className="font-medium">trattum.com <Badge variant="default" className="ml-2 bg-emerald-600">Verificado</Badge></p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide">Remetente</p>
                <p className="font-medium font-mono text-xs">noreply@trattum.com</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide">Último envio</p>
                <p className="font-medium">
                  {lastSent ? formatDistanceToNow(new Date(lastSent), { addSuffix: true, locale: ptBR }) : 'Nenhum registro'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Templates */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Templates de e-mail</CardTitle>
            <CardDescription>
              {isAdmin ? 'Edite assunto, corpo e ative o modo teste para validar antes de mandar para pacientes.'
                       : 'Visualização somente leitura. Apenas administradores podem editar.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Gatilho</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Modo teste</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map(t => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <div className="font-medium">{t.nome}</div>
                      <div className="text-xs text-muted-foreground font-mono">{t.codigo}</div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.gatilho}</TableCell>
                    <TableCell>
                      {isAdmin ? (
                        <Switch checked={t.ativo} onCheckedChange={(v) => toggleAtivo(t, v)} />
                      ) : (
                        <Badge variant={t.ativo ? 'default' : 'secondary'}>
                          {t.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {isAdmin ? (
                          <Switch checked={t.modo_teste} onCheckedChange={(v) => toggleModoTeste(t, v)} />
                        ) : (
                          <Badge variant={t.modo_teste ? 'destructive' : 'outline'}>
                            {t.modo_teste ? 'Teste' : 'Produção'}
                          </Badge>
                        )}
                        {t.modo_teste && (
                          <Tooltip>
                            <TooltipTrigger><AlertTriangle className="h-4 w-4 text-amber-600" /></TooltipTrigger>
                            <TooltipContent>Envia somente para o admin logado</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {isAdmin && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openTest(t)}>
                            <Send className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Log */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-serif">Log de envios</CardTitle>
              <CardDescription>Últimos 50 envios registrados</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={load}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quando</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Destinatário</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Modo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum envio ainda</TableCell></TableRow>
                )}
                {logs.map(l => (
                  <FragmentRow
                    key={l.id}
                    log={l}
                    expanded={expandedLog === l.id}
                    onToggle={() => setExpandedLog(expandedLog === l.id ? null : l.id)}
                    templateName={templateNameByCode(l.template_codigo)}
                  />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit dialog */}
        <Dialog open={editDialog} onOpenChange={setEditDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar template — {editing?.nome}</DialogTitle>
              <DialogDescription className="font-mono text-xs">{editing?.codigo}</DialogDescription>
            </DialogHeader>
            {editing && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-4">
                    <div>
                      <Label>Assunto</Label>
                      <Input value={editing.assunto} onChange={e => setEditing({ ...editing, assunto: e.target.value })} />
                    </div>
                    <div>
                      <Label>Corpo HTML</Label>
                      <Textarea
                        value={editing.corpo_html}
                        onChange={e => setEditing({ ...editing, corpo_html: e.target.value })}
                        className="font-mono text-xs h-80"
                      />
                    </div>
                    <div className="flex gap-6">
                      <div className="flex items-center gap-2">
                        <Switch checked={editing.ativo} onCheckedChange={v => setEditing({ ...editing, ativo: v })} />
                        <Label>Ativo</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={editing.modo_teste} onCheckedChange={v => setEditing({ ...editing, modo_teste: v })} />
                        <Label>Modo teste</Label>
                        <Tooltip>
                          <TooltipTrigger><AlertTriangle className="h-3 w-3 text-amber-600" /></TooltipTrigger>
                          <TooltipContent>Quando ativo, o e-mail é enviado apenas para o seu próprio endereço, não para o paciente.</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label>Variáveis disponíveis</Label>
                    <div className="space-y-1 mt-2">
                      {editing.variaveis_disponiveis.map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => copyVar(v)}
                          className="w-full text-left px-2 py-1 text-xs font-mono bg-muted hover:bg-muted/70 rounded flex items-center justify-between"
                        >
                          <span>{v}</span><Copy className="h-3 w-3" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="ghost" onClick={() => setEditDialog(false)}>Cancelar</Button>
              <Button onClick={saveEdit} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Test dialog */}
        <Dialog open={testDialog} onOpenChange={setTestDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enviar teste — {testing?.nome}</DialogTitle>
              <DialogDescription>O e-mail será marcado como modo teste no log.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Enviar para</Label>
                <Input value={testTarget} onChange={e => setTestTarget(e.target.value)} type="email" />
              </div>
              {testing?.variaveis_disponiveis.map(v => {
                const key = v.replace(/[{}]/g, '').trim();
                return (
                  <div key={key}>
                    <Label className="font-mono text-xs">{key}</Label>
                    <Input
                      value={testVars[key] || ''}
                      onChange={e => setTestVars({ ...testVars, [key]: e.target.value })}
                    />
                  </div>
                );
              })}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setTestDialog(false)}>Cancelar</Button>
              <Button onClick={sendTest} disabled={testSending || !testTarget}>
                {testSending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Enviar teste
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
