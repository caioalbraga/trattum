import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Eye, 
  CheckCircle, 
  XCircle,
  Clock,
  Loader2,
  User,
  AlertTriangle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { impedimentNoteSchema } from '@/lib/validation-schemas';
import { decryptProfiles } from '@/lib/crypto-client';

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

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pendente: { label: 'Pendente', variant: 'secondary' },
  aprovado: { label: 'Aprovado', variant: 'default' },
  bloqueado: { label: 'Bloqueado', variant: 'destructive' },
  em_revisao: { label: 'Em Revisão', variant: 'outline' },
};

// ── Question label map (matches ClinicalDossier) ─────────────────────────────
const questionLabels: Record<string, string> = {
  motivos_emagrecer:        'Motivos para emagrecer',
  apoio_programa:           'Áreas de apoio desejadas',
  dificuldade_emagrecimento:'Principal dificuldade',
  genero_nascimento:        'Gênero ao nascimento',
  idade:                    'Faixa etária',
  altura_peso:              'Altura / Peso',
  tem_meta_peso:            'Tem meta de peso?',
  qual_meta_peso:           'Meta de peso (kg)',
  peso_maximo:              'Peso máximo na vida (kg)',
  gordura_localizada:       'Região de gordura localizada',
  tempo_tentativa:          'Tempo tentando emagrecer',
  metodos_anteriores:       'Métodos já utilizados',
  frequencia_exercicios:    'Frequência de exercícios',
  vontade_comer_incontrolavel: 'Fome incontrolável fora das refeições',
  comer_estressado:         'Come quando estressado?',
  habito_beliscar:          'Hábito de beliscar',
  consumo_alcool:           'Consumo de álcool',
  etapa_21_triagem_transtorno: 'Diagnóstico de transtorno alimentar?',
  etapa_22_qual_transtorno: 'Qual transtorno alimentar',
  etapa_23_bulimia_3meses:  'Comportamento bulímico (últimos 3 meses)',
  etapa_24_anorexia_3meses: 'Restrição severa alimentar (últimos 3 meses)',
  saude_mental_diagnostico: 'Condição de saúde mental diagnosticada?',
  quais_condicoes_mentais:  'Condições mentais diagnosticadas',
  tomando_medicamento_mental:'Medicamento para saúde mental?',
  detalhe_medicamento_mental:'Qual medicamento mental',
  condicoes_medicas_lista:  'Condições médicas (coração, rins, fígado…)?',
  etapa_30:                 'Doenças do coração',
  etapa_31:                 'Doenças hormonais ou renais',
  etapa_32:                 'Problemas de estômago/intestino',
  etapa_33:                 'Condições adicionais (Convulsões, Glaucoma, Câncer)',
  etapa_34:                 'Condições: Pressão Alta, Colesterol, Refluxo, Apneia',
  etapa_35:                 'Cirurgia bariátrica',
  etapa_36:                 'Medicamentos / suplementos (últimos 30 dias)?',
  etapa_37:                 'Quais medicamentos e por quê',
  etapa_38:                 'Possui alergias?',
  etapa_39:                 'Alergia a qual medicamento',
  etapa_40:                 'Informações adicionais de saúde?',
  etapa_41:                 'Detalhes adicionais',
  etapa_43:                 'Aceita medicamentos injetáveis?',
};

const questionCategories: Record<string, { title: string; keys: string[] }> = {
  biometria: {
    title: 'Dados Biométricos',
    keys: ['genero_nascimento', 'idade', 'altura_peso', 'tem_meta_peso', 'qual_meta_peso', 'peso_maximo', 'gordura_localizada'],
  },
  historico: {
    title: 'Histórico de Saúde',
    keys: [
      'condicoes_medicas_lista', 'etapa_30', 'etapa_31', 'etapa_32', 'etapa_33', 'etapa_34', 'etapa_35',
      'etapa_36', 'etapa_37', 'etapa_38', 'etapa_39', 'etapa_40', 'etapa_41',
      'etapa_21_triagem_transtorno', 'etapa_22_qual_transtorno',
      'etapa_23_bulimia_3meses', 'etapa_24_anorexia_3meses',
      'saude_mental_diagnostico', 'quais_condicoes_mentais',
      'tomando_medicamento_mental', 'detalhe_medicamento_mental',
      'consumo_alcool', 'etapa_43',
    ],
  },
  estilo_vida: {
    title: 'Hábitos de Vida',
    keys: [
      'frequencia_exercicios', 'vontade_comer_incontrolavel', 'comer_estressado',
      'habito_beliscar', 'tempo_tentativa', 'metodos_anteriores',
    ],
  },
  metas: {
    title: 'Metas e Objetivos',
    keys: ['motivos_emagrecer', 'apoio_programa', 'dificuldade_emagrecimento'],
  },
};

// ── Helper: format values professionally ─────────────────────────────────────
function formatLabel(raw: string): string {
  const lower = raw.toLowerCase().trim();
  if (lower === 'false' || lower === 'nao' || lower === 'não') return 'Não';
  if (lower === 'true' || lower === 'sim') return 'Sim';
  return raw.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (Array.isArray(value)) return value.map(v => formatLabel(String(v))).join(', ');
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if ('altura' in obj && 'peso' in obj) return `${obj.altura} cm / ${obj.peso} kg`;
    return Object.entries(obj).map(([k, v]) => `${formatLabel(k)}: ${v}`).join(', ');
  }
  return formatLabel(String(value));
}

export default function AdminInbox() {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAvaliacao, setSelectedAvaliacao] = useState<Avaliacao | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [impedimentNote, setImpedimentNote] = useState('');
  const [noteError, setNoteError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
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
      
      // Fetch profiles separately
      const userIds = data?.map(a => a.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, nome, whatsapp')
        .in('user_id', userIds);

      // Decrypt profiles in batch
      const decryptedProfiles = await decryptProfiles(profiles || []);

      const mergedData = (data || []).map(avaliacao => ({
        ...avaliacao,
        profile: decryptedProfiles.find(p => p.user_id === avaliacao.user_id) || null
      }));

      setAvaliacoes(mergedData as Avaliacao[]);
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

  const handleApprove = async (avaliacao: Avaliacao) => {
    setProcessing(true);
    try {
      // Update status to approved
      const { error: updateError } = await supabase
        .from('avaliacoes')
        .update({ status: 'aprovado' })
        .eq('id', avaliacao.id);

      if (updateError) throw updateError;

      // Create prescription record
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

      // Update tratamentos status
      await supabase
        .from('tratamentos')
        .update({ status: 'aprovado' })
        .eq('user_id', avaliacao.user_id);

      toast({
        title: "Avaliação aprovada!",
        description: "Prescrição criada e paciente notificado.",
      });

      fetchAvaliacoes();
      setViewDialogOpen(false);
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

    // Validate the note using zod schema
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
      // Update status to blocked
      const { error: updateError } = await supabase
        .from('avaliacoes')
        .update({ status: 'bloqueado' })
        .eq('id', selectedAvaliacao.id);

      if (updateError) throw updateError;

      // Create impediment note with validated/trimmed data
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error: noteError } = await supabase
        .from('notas_impedimento')
        .insert({
          user_id: selectedAvaliacao.user_id,
          avaliacao_id: selectedAvaliacao.id,
          nota: validation.data.nota, // Use validated/trimmed data
          criado_por: user?.id,
        });

      if (noteError) throw noteError;

      toast({
        title: "Impedimento registrado",
        description: "O paciente será notificado sobre a revisão necessária.",
      });

      setBlockDialogOpen(false);
      setImpedimentNote('');
      fetchAvaliacoes();
      setViewDialogOpen(false);
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

  const filteredAvaliacoes = avaliacoes.filter(a => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const nome = (a.profile?.nome || a.user_id).toLowerCase();
    return nome.includes(searchLower) || a.status.includes(searchLower);
  });

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-muted-foreground';
    if (score <= 30) return 'text-emerald-600';
    if (score <= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const renderAnswersByCategory = (respostas: Record<string, any>) => {
    const allMappedKeys = new Set(Object.values(questionCategories).flatMap(c => c.keys));
    
    return (
      <Accordion type="multiple" className="w-full" defaultValue={['biometria']}>
        {Object.entries(questionCategories).map(([categoryId, category]) => {
          const categoryAnswers = category.keys
            .filter(k => respostas[k] !== undefined && respostas[k] !== null && respostas[k] !== '')
            .map(k => ({ key: k, value: respostas[k] }));
          
          if (categoryAnswers.length === 0) return null;
          
          return (
            <AccordionItem key={categoryId} value={categoryId}>
              <AccordionTrigger className="text-sm font-medium">
                {category.title} ({categoryAnswers.length})
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {categoryAnswers.map(({ key, value }) => {
                    const formatted = displayValue(value);
                    if (formatted === '—') return null;
                    return (
                      <div key={key} className="flex justify-between text-sm py-1 border-b border-border/50">
                        <span className="text-muted-foreground">{questionLabels[key] || formatLabel(key)}</span>
                        <span className="font-medium text-right max-w-[50%]">{formatted}</span>
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
        
        {/* Outras respostas */}
        {(() => {
          const otherAnswers = Object.entries(respostas).filter(([key]) => !allMappedKeys.has(key));
          if (otherAnswers.length === 0) return null;
          return (
            <AccordionItem value="outras">
              <AccordionTrigger className="text-sm font-medium">
                Outras Respostas ({otherAnswers.length})
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {otherAnswers.map(([key, value]) => {
                    const formatted = displayValue(value);
                    if (formatted === '—') return null;
                    return (
                      <div key={key} className="flex justify-between text-sm py-1 border-b border-border/50">
                        <span className="text-muted-foreground">{questionLabels[key] || formatLabel(key)}</span>
                        <span className="font-medium text-right max-w-[50%]">{formatted}</span>
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })()}
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold">Inbox de Avaliações</h1>
            <p className="text-muted-foreground">
              Fila de triagem clínica
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(statusConfig).map(([status, config]) => {
            const count = avaliacoes.filter(a => a.status === status).length;
            return (
              <Card key={status} className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setSearchTerm(status)}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <Badge variant={config.variant}>{config.label}</Badge>
                    <span className="text-2xl font-bold">{count}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Fila de Espera</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>IMC</TableHead>
                  <TableHead>Score de Risco</TableHead>
                  <TableHead>Tempo de Espera</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAvaliacoes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhuma avaliação encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAvaliacoes.map((avaliacao) => (
                    <TableRow key={avaliacao.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-4 w-4" />
                          </div>
                          <span className="font-medium">
                            {(() => {
                              const nome = avaliacao.profile?.nome;
                              const nomeCompleto = avaliacao.respostas?.nome_completo as string | undefined;
                              if (nome && !nome.includes('@')) return nome;
                              if (nomeCompleto) return nomeCompleto;
                              return nome || 'Paciente';
                            })()}
                          </span>
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {avaliacao.imc?.toFixed(1) || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <span className={getScoreColor(avaliacao.score_risco)}>
                          {avaliacao.score_risco ?? 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(avaliacao.created_at), {
                            addSuffix: true,
                            locale: ptBR
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusConfig[avaliacao.status]?.variant || 'secondary'}>
                          {statusConfig[avaliacao.status]?.label || avaliacao.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedAvaliacao(avaliacao);
                            setViewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* View Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-serif">
                Avaliação de {(() => {
                  const nome = selectedAvaliacao?.profile?.nome;
                  const nomeCompleto = selectedAvaliacao?.respostas?.nome_completo as string | undefined;
                  if (nome && !nome.includes('@')) return nome;
                  if (nomeCompleto) return nomeCompleto;
                  return nome || 'Paciente';
                })()}
              </DialogTitle>
              <DialogDescription>
                Visualização 360° das respostas do questionário
              </DialogDescription>
            </DialogHeader>

            {selectedAvaliacao && (
              <div className="space-y-4">
                {/* Quick Info */}
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-muted-foreground">IMC</p>
                      <p className="text-xl font-bold">{selectedAvaliacao.imc?.toFixed(1) || 'N/A'}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-muted-foreground">Score de Risco</p>
                      <p className={`text-xl font-bold ${getScoreColor(selectedAvaliacao.score_risco)}`}>
                        {selectedAvaliacao.score_risco ?? 'N/A'}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-muted-foreground">Status</p>
                      <Badge variant={statusConfig[selectedAvaliacao.status]?.variant}>
                        {statusConfig[selectedAvaliacao.status]?.label}
                      </Badge>
                    </CardContent>
                  </Card>
                </div>

                {/* Answers */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Respostas do Questionário</h4>
                  {renderAnswersByCategory(selectedAvaliacao.respostas)}
                </div>

                {/* Actions */}
                {selectedAvaliacao.status === 'pendente' && (
                  <DialogFooter className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setBlockDialogOpen(true);
                      }}
                      disabled={processing}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Sinalizar Impedimento
                    </Button>
                    <Button
                      onClick={() => handleApprove(selectedAvaliacao)}
                      disabled={processing}
                    >
                      {processing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Aprovar
                    </Button>
                  </DialogFooter>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Block Dialog */}
        <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Sinalizar Impedimento
              </DialogTitle>
              <DialogDescription>
                Descreva o motivo do impedimento. O paciente receberá esta nota e precisará revisar seu plano.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Textarea
                placeholder="Ex: Necessário ajuste de dosagem devido a..."
                value={impedimentNote}
                onChange={(e) => {
                  setImpedimentNote(e.target.value);
                  setNoteError(null); // Clear error on input change
                }}
                rows={5}
                className={noteError ? 'border-destructive' : ''}
              />
              {noteError && (
                <p className="text-sm text-destructive">{noteError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Mínimo 10 caracteres, máximo 1000.
              </p>
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
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Confirmar Bloqueio
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
