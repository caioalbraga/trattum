import { useEffect, useState, useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  CheckCircle, 
  XCircle,
  Clock,
  Loader2,
  User,
  AlertTriangle,
  AlertCircle,
  Shield,
  Activity,
  Scale,
  Heart,
  Utensils
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { impedimentNoteSchema } from '@/lib/validation-schemas';
import { decryptProfiles } from '@/lib/crypto-client';
import { cn } from '@/lib/utils';

interface Avaliacao {
  id: string;
  user_id: string;
  respostas: any;
  status: string;
  imc: number | null;
  score_risco: number | null;
  created_at: string;
  updated_at: string;
  profile?: {
    nome: string | null;
    whatsapp: string | null;
  };
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
  pendente: { label: 'Pendente', variant: 'secondary', color: 'bg-amber-500' },
  aprovado: { label: 'Aprovado', variant: 'default', color: 'bg-emerald-500' },
  bloqueado: { label: 'Bloqueado', variant: 'destructive', color: 'bg-red-500' },
  em_revisao: { label: 'Em Revisão', variant: 'outline', color: 'bg-blue-500' },
};

const questionCategories: Record<string, { keys: string[]; icon: any; label: string }> = {
  biometria: { keys: ['altura', 'peso', 'imc', 'idade', 'sexo'], icon: Scale, label: 'Biometria' },
  historico: { keys: ['condicoes', 'medicamentos', 'alergias', 'cirurgias', 'doencas'], icon: Heart, label: 'Histórico de Saúde' },
  habitos: { keys: ['exercicios', 'alimentacao', 'sono', 'estresse', 'alcool', 'fumo'], icon: Utensils, label: 'Hábitos de Vida' },
  objetivos: { keys: ['objetivo', 'expectativa', 'motivacao', 'meta'], icon: Activity, label: 'Objetivos' },
};

// Risk level based on IMC and responses
const getRiskLevel = (imc: number | null, respostas: any): { level: 'low' | 'medium' | 'high' | 'critical'; label: string; color: string } => {
  const hasContraindication = respostas?.condicoes_graves || respostas?.medicamentos_restritos;
  
  if (hasContraindication) {
    return { level: 'critical', label: 'Crítico', color: 'text-red-600 bg-red-50 border-red-200' };
  }
  
  if (imc === null) {
    return { level: 'medium', label: 'Atenção', color: 'text-amber-600 bg-amber-50 border-amber-200' };
  }
  
  if (imc >= 40) {
    return { level: 'high', label: 'Alto', color: 'text-orange-600 bg-orange-50 border-orange-200' };
  }
  
  if (imc >= 30) {
    return { level: 'medium', label: 'Moderado', color: 'text-amber-600 bg-amber-50 border-amber-200' };
  }
  
  return { level: 'low', label: 'Baixo', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
};

const RiskIndicator = ({ imc, respostas }: { imc: number | null; respostas: any }) => {
  const risk = getRiskLevel(imc, respostas);
  const Icon = risk.level === 'critical' ? AlertCircle : risk.level === 'high' ? AlertTriangle : Shield;
  
  return (
    <div className={cn('flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium', risk.color)}>
      <Icon className="w-3 h-3" />
      {risk.label}
    </div>
  );
};

export default function AdminInbox() {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAvaliacao, setSelectedAvaliacao] = useState<Avaliacao | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [impedimentNote, setImpedimentNote] = useState('');
  const [noteError, setNoteError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAvaliacoes();
  }, []);

  const fetchAvaliacoes = async () => {
    try {
      const { data, error } = await supabase
        .from('avaliacoes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const userIds = data?.map(a => a.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, nome, whatsapp')
        .in('user_id', userIds);

      const decryptedProfiles = await decryptProfiles(profiles || []);

      const mergedData = (data || []).map(avaliacao => ({
        ...avaliacao,
        profile: decryptedProfiles.find(p => p.user_id === avaliacao.user_id) || null
      }));

      setAvaliacoes(mergedData as Avaliacao[]);
      
      // Auto-select first pending if none selected
      if (!selectedAvaliacao) {
        const firstPending = mergedData.find(a => a.status === 'pendente');
        if (firstPending) setSelectedAvaliacao(firstPending as Avaliacao);
      }
    } catch (error) {
      console.error('Error fetching avaliacoes:', error);
      toast({
        title: "Erro ao carregar avaliações",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAvaliacao = (avaliacao: Avaliacao) => {
    setDetailLoading(true);
    setSelectedAvaliacao(avaliacao);
    // Simulate loading for smooth transition
    setTimeout(() => setDetailLoading(false), 300);
  };

  const handleApprove = async (avaliacao: Avaliacao) => {
    setProcessing(true);
    try {
      const { error: updateError } = await supabase
        .from('avaliacoes')
        .update({ status: 'aprovado' })
        .eq('id', avaliacao.id);

      if (updateError) throw updateError;

      const { error: prescError } = await supabase
        .from('prescricoes')
        .insert({
          user_id: avaliacao.user_id,
          avaliacao_id: avaliacao.id,
          tratamento: 'Wegovy',
          dosagem: '0.25mg',
          observacoes: 'Prescrição inicial aprovada',
        });

      if (prescError) throw prescError;

      await supabase
        .from('tratamentos')
        .update({ status: 'ativo' })
        .eq('user_id', avaliacao.user_id);

      toast({
        title: "Avaliação aprovada!",
        description: "Prescrição criada e paciente notificado.",
      });

      fetchAvaliacoes();
    } catch (error) {
      console.error('Error approving:', error);
      toast({
        title: "Erro ao aprovar",
        description: "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleBlock = async () => {
    if (!selectedAvaliacao) return;

    const validation = impedimentNoteSchema.safeParse({ nota: impedimentNote });
    
    if (!validation.success) {
      const errorMessage = validation.error.errors[0]?.message || 'Nota inválida';
      setNoteError(errorMessage);
      toast({
        title: "Erro de validação",
        description: errorMessage,
        variant: "destructive",
      });
      return;
    }

    setNoteError(null);
    setProcessing(true);
    
    try {
      const { error: updateError } = await supabase
        .from('avaliacoes')
        .update({ status: 'bloqueado' })
        .eq('id', selectedAvaliacao.id);

      if (updateError) throw updateError;

      const { data: { user } } = await supabase.auth.getUser();
      
      const { error: noteErr } = await supabase
        .from('notas_impedimento')
        .insert({
          user_id: selectedAvaliacao.user_id,
          avaliacao_id: selectedAvaliacao.id,
          nota: validation.data.nota,
          criado_por: user?.id,
        });

      if (noteErr) throw noteErr;

      toast({
        title: "Impedimento registrado",
        description: "O paciente será notificado sobre a revisão necessária.",
      });

      setBlockDialogOpen(false);
      setImpedimentNote('');
      fetchAvaliacoes();
    } catch (error) {
      console.error('Error blocking:', error);
      toast({
        title: "Erro ao bloquear",
        description: "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const filteredAvaliacoes = useMemo(() => {
    return avaliacoes.filter(a => {
      const matchesSearch = !searchTerm || 
        (a.profile?.nome || a.user_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.status.includes(searchTerm.toLowerCase());
      
      const matchesStatus = !statusFilter || a.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [avaliacoes, searchTerm, statusFilter]);

  const statusCounts = useMemo(() => {
    return {
      pendente: avaliacoes.filter(a => a.status === 'pendente').length,
      aprovado: avaliacoes.filter(a => a.status === 'aprovado').length,
      bloqueado: avaliacoes.filter(a => a.status === 'bloqueado').length,
      em_revisao: avaliacoes.filter(a => a.status === 'em_revisao').length,
    };
  }, [avaliacoes]);

  const renderAnswersByCategory = (respostas: Record<string, any>) => {
    return (
      <Accordion type="multiple" className="w-full" defaultValue={['biometria']}>
        {Object.entries(questionCategories).map(([key, category]) => {
          const categoryAnswers = Object.entries(respostas).filter(([k]) => 
            category.keys.some(ck => k.toLowerCase().includes(ck))
          );
          
          if (categoryAnswers.length === 0) return null;
          const Icon = category.icon;
          
          return (
            <AccordionItem key={key} value={key} className="border-b border-border/50">
              <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  {category.label}
                  <Badge variant="outline" className="ml-2 text-[10px]">
                    {categoryAnswers.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="space-y-2">
                  {categoryAnswers.map(([k, value]) => (
                    <div key={k} className="flex justify-between text-sm py-1.5 px-2 rounded-md bg-muted/30">
                      <span className="text-muted-foreground capitalize text-xs">{k.replace(/_/g, ' ')}</span>
                      <span className="font-medium font-mono-numbers text-xs">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-tight">Inbox Clínico</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Triagem e aprovação de avaliações
            </p>
          </div>
          
          {/* Status filters */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStatusFilter(null)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                !statusFilter ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              Todos ({avaliacoes.length})
            </button>
            {Object.entries(statusConfig).map(([status, config]) => (
              <button
                key={status}
                onClick={() => setStatusFilter(statusFilter === status ? null : status)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5',
                  statusFilter === status ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                <div className={cn('w-2 h-2 rounded-full', config.color)} />
                {statusCounts[status as keyof typeof statusCounts]}
              </button>
            ))}
          </div>
        </div>

        {/* Master-Detail Layout */}
        <div className="grid lg:grid-cols-5 gap-6 h-[calc(100%-4rem)]">
          {/* Master List */}
          <div className="lg:col-span-2 card-glass overflow-hidden flex flex-col">
            {/* Search */}
            <div className="p-4 border-b border-border/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar paciente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-background/50"
                />
              </div>
            </div>
            
            {/* List */}
            <ScrollArea className="flex-1">
              {filteredAvaliacoes.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhuma avaliação encontrada
                </div>
              ) : (
                filteredAvaliacoes.map((avaliacao) => (
                  <div
                    key={avaliacao.id}
                    onClick={() => handleSelectAvaliacao(avaliacao)}
                    className={cn(
                      'master-list-item',
                      selectedAvaliacao?.id === avaliacao.id && 'active'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {avaliacao.profile?.nome || 'Paciente'}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDistanceToNow(new Date(avaliacao.created_at), {
                                addSuffix: true,
                                locale: ptBR
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1.5">
                        <Badge 
                          variant={statusConfig[avaliacao.status]?.variant || 'secondary'}
                          className="text-[10px]"
                        >
                          {statusConfig[avaliacao.status]?.label || avaliacao.status}
                        </Badge>
                        <RiskIndicator imc={avaliacao.imc} respostas={avaliacao.respostas} />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </ScrollArea>
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-3 card-glass overflow-hidden flex flex-col">
            {!selectedAvaliacao ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Selecione uma avaliação para visualizar
              </div>
            ) : detailLoading ? (
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Skeleton className="h-20 rounded-lg" />
                  <Skeleton className="h-20 rounded-lg" />
                  <Skeleton className="h-20 rounded-lg" />
                </div>
                <Skeleton className="h-40 rounded-lg" />
              </div>
            ) : (
              <>
                {/* Detail Header */}
                <div className="p-6 border-b border-border/50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <h2 className="font-serif text-xl font-semibold">
                          {selectedAvaliacao.profile?.nome || 'Paciente'}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {selectedAvaliacao.profile?.whatsapp || 'WhatsApp não informado'}
                        </p>
                      </div>
                    </div>
                    <Badge variant={statusConfig[selectedAvaliacao.status]?.variant}>
                      {statusConfig[selectedAvaliacao.status]?.label}
                    </Badge>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="p-6 border-b border-border/50">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="metric-card p-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">IMC</p>
                      <p className="text-2xl font-mono-numbers font-semibold mt-1">
                        {selectedAvaliacao.imc?.toFixed(1) || 'N/A'}
                      </p>
                    </div>
                    <div className="metric-card p-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Score Risco</p>
                      <p className={cn(
                        'text-2xl font-mono-numbers font-semibold mt-1',
                        (selectedAvaliacao.score_risco || 0) > 60 ? 'text-red-600' :
                        (selectedAvaliacao.score_risco || 0) > 30 ? 'text-amber-600' : 'text-emerald-600'
                      )}>
                        {selectedAvaliacao.score_risco ?? 'N/A'}
                      </p>
                    </div>
                    <div className="metric-card p-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Risco</p>
                      <div className="mt-2">
                        <RiskIndicator 
                          imc={selectedAvaliacao.imc} 
                          respostas={selectedAvaliacao.respostas} 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Answers */}
                <ScrollArea className="flex-1 p-6">
                  <h3 className="text-sm font-semibold mb-4">Respostas do Questionário</h3>
                  {renderAnswersByCategory(selectedAvaliacao.respostas)}
                </ScrollArea>

                {/* Actions */}
                {selectedAvaliacao.status === 'pendente' && (
                  <div className="p-6 border-t border-border/50 bg-muted/30">
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleApprove(selectedAvaliacao)}
                        disabled={processing}
                        className="flex-1 gap-2"
                      >
                        {processing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        Aprovar Tratamento
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => setBlockDialogOpen(true)}
                        disabled={processing}
                        className="gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        Bloquear
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Block Dialog */}
        <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-serif">Registrar Impedimento</DialogTitle>
              <DialogDescription>
                Informe o motivo pelo qual este paciente não pode prosseguir com o tratamento.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="note">Nota de Impedimento</Label>
                <Textarea
                  id="note"
                  value={impedimentNote}
                  onChange={(e) => {
                    setImpedimentNote(e.target.value);
                    setNoteError(null);
                  }}
                  placeholder="Descreva o motivo do impedimento..."
                  rows={4}
                  className={noteError ? 'border-destructive' : ''}
                />
                {noteError && (
                  <p className="text-sm text-destructive">{noteError}</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setBlockDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleBlock}
                disabled={processing || !impedimentNote.trim()}
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Confirmar Bloqueio
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
