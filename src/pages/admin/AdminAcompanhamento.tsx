import { useEffect, useState, useRef } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { decryptProfiles } from '@/lib/crypto-client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, Send, User, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Patient {
  user_id: string;
  nome: string;
  unread_count: number;
}

interface Message {
  id: string;
  user_id: string;
  autor: string;
  mensagem: string | null;
  imagem_url: string | null;
  lida: boolean;
  created_at: string;
}

export default function AdminAcompanhamento() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      fetchMessages(selectedPatient.user_id);
      markAsRead(selectedPatient.user_id);

      // Subscribe to realtime
      const channel = supabase
        .channel(`chat-${selectedPatient.user_id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'mensagens_acompanhamento',
          filter: `user_id=eq.${selectedPatient.user_id}`,
        }, (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
          if ((payload.new as Message).autor === 'paciente') {
            markAsRead(selectedPatient.user_id);
          }
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [selectedPatient?.user_id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchPatients = async () => {
    try {
      // Get patients with approved + paid treatments (processamento, enviado, entregue, em_andamento)
      const { data: tratamentos } = await supabase
        .from('tratamentos')
        .select('user_id')
        .in('status', ['processamento', 'enviado', 'entregue', 'em_andamento']);

      if (!tratamentos?.length) {
        setLoadingPatients(false);
        return;
      }

      const userIds = tratamentos.map(t => t.user_id);

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, nome')
        .in('user_id', userIds);

      const decrypted = await decryptProfiles(profiles || []);

      // Get unread counts
      const { data: unreadData } = await supabase
        .from('mensagens_acompanhamento')
        .select('user_id')
        .eq('autor', 'paciente')
        .eq('lida', false)
        .in('user_id', userIds);

      const unreadMap = new Map<string, number>();
      unreadData?.forEach(m => {
        unreadMap.set(m.user_id, (unreadMap.get(m.user_id) || 0) + 1);
      });

      // Also get avaliacoes for nome_completo fallback
      const { data: avaliacoes } = await supabase
        .from('avaliacoes')
        .select('user_id, respostas')
        .in('user_id', userIds)
        .order('created_at', { ascending: false });

      const nomeMap = new Map<string, string>();
      avaliacoes?.forEach(a => {
        if (!nomeMap.has(a.user_id)) {
          const nc = (a.respostas as Record<string, unknown>)?.nome_completo as string | undefined;
          if (nc) nomeMap.set(a.user_id, nc);
        }
      });

      const patientList: Patient[] = userIds.map(uid => {
        const profile = decrypted.find(p => p.user_id === uid);
        const profileName = profile?.nome;
        const isEmail = profileName?.includes('@');
        const nome = (isEmail ? nomeMap.get(uid) : profileName) || nomeMap.get(uid) || profileName || 'Paciente';
        return {
          user_id: uid,
          nome,
          unread_count: unreadMap.get(uid) || 0,
        };
      });

      // Sort: unread first, then alphabetically
      patientList.sort((a, b) => {
        if (a.unread_count !== b.unread_count) return b.unread_count - a.unread_count;
        return a.nome.localeCompare(b.nome);
      });

      setPatients(patientList);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Erro ao carregar pacientes' });
    } finally {
      setLoadingPatients(false);
    }
  };

  const fetchMessages = async (userId: string) => {
    setLoadingMessages(true);
    try {
      const { data } = await supabase
        .from('mensagens_acompanhamento')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      setMessages((data as Message[]) || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const markAsRead = async (userId: string) => {
    await supabase
      .from('mensagens_acompanhamento')
      .update({ lida: true } as any)
      .eq('user_id', userId)
      .eq('autor', 'paciente')
      .eq('lida', false);

    setPatients(prev => prev.map(p =>
      p.user_id === userId ? { ...p, unread_count: 0 } : p
    ));
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedPatient) return;
    setSending(true);
    try {
      await supabase.from('mensagens_acompanhamento').insert({
        user_id: selectedPatient.user_id,
        autor: 'medico',
        mensagem: newMessage.trim(),
      } as any);

      setNewMessage('');
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Erro ao enviar mensagem' });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <h1 className="font-serif text-2xl font-semibold text-foreground">Acompanhamento</h1>
          <p className="text-muted-foreground mt-1">Comunicação direta com pacientes em tratamento</p>
        </header>

        <div className="bg-card border border-border/60 rounded-xl overflow-hidden flex" style={{ height: 'calc(100vh - 220px)' }}>
          {/* Patient List */}
          <div className="w-80 border-r border-border/60 flex flex-col">
            <div className="p-4 border-b border-border/60">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Pacientes</h2>
            </div>
            <ScrollArea className="flex-1">
              {loadingPatients ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : patients.length === 0 ? (
                <div className="text-center py-12 text-sm text-muted-foreground px-4">
                  Nenhum paciente elegível para acompanhamento.
                </div>
              ) : (
                patients.map(patient => (
                  <button
                    key={patient.user_id}
                    onClick={() => setSelectedPatient(patient)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b border-border/30',
                      selectedPatient?.user_id === patient.user_id && 'bg-primary/5'
                    )}
                  >
                    <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{patient.nome}</p>
                    </div>
                    {patient.unread_count > 0 && (
                      <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                        {patient.unread_count}
                      </span>
                    )}
                  </button>
                ))
              )}
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {!selectedPatient ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Selecione um paciente para iniciar a conversa</p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="px-6 py-4 border-b border-border/60 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium text-foreground">{selectedPatient.nome}</h3>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 min-h-0">
                  <div className="p-6 space-y-4">
                    {loadingMessages ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-12 text-sm text-muted-foreground">
                        Nenhuma mensagem ainda. Inicie a conversa.
                      </div>
                    ) : (
                      messages.map(msg => (
                        <div
                          key={msg.id}
                          className={cn(
                            'max-w-[75%] p-3 rounded-2xl text-sm',
                            msg.autor === 'medico'
                              ? 'ml-auto bg-primary text-primary-foreground rounded-br-md'
                              : 'mr-auto bg-muted rounded-bl-md'
                          )}
                        >
                          {msg.imagem_url && (
                            <img src={msg.imagem_url} alt="Imagem" className="rounded-lg max-w-full mb-2" />
                          )}
                          {msg.mensagem && <p>{msg.mensagem}</p>}
                          <p className={cn(
                            'text-[10px] mt-1',
                            msg.autor === 'medico' ? 'text-primary-foreground/60' : 'text-muted-foreground'
                          )}>
                            {format(new Date(msg.created_at), "dd/MM HH:mm", { locale: ptBR })}
                            {msg.autor === 'medico' && msg.lida && ' ✓✓'}
                          </p>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="px-6 py-4 border-t border-border/60 flex gap-3">
                  <Textarea
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Digite sua mensagem..."
                    className="min-h-[44px] max-h-[120px] resize-none flex-1 text-sm"
                    rows={1}
                  />
                  <Button
                    size="icon"
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="h-11 w-11 flex-shrink-0"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
