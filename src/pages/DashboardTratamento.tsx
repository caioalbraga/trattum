import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FileText, Calendar, Activity, ArrowRight, Sparkles, CreditCard, Clock } from 'lucide-react';
import { TratamentoSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { FadeInContent } from '@/components/dashboard/FadeInContent';

interface Tratamento {
  status: string;
  plano: string | null;
  data_inicio: string | null;
  data_proxima_renovacao: string | null;
  documento_pdf_url: string | null;
  observacoes: string | null;
}

interface Pedido {
  id: string;
  status: string;
  valor: number;
  descricao: string | null;
  created_at: string;
}

interface Avaliacao {
  id: string;
  status: string;
  created_at: string;
}

export default function DashboardTratamento() {
  const { user } = useAuth();
  const [tratamento, setTratamento] = useState<Tratamento | null>(null);
  const [pedidoPendente, setPedidoPendente] = useState<Pedido | null>(null);
  const [avaliacaoFeita, setAvaliacaoFeita] = useState<Avaliacao | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch tratamento, pedido pendente e avaliação em paralelo
      const [tratamentoRes, pedidoRes, avaliacaoRes] = await Promise.all([
        supabase
          .from('tratamentos')
          .select('*')
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('pedidos')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'pendente')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('avaliacoes')
          .select('id, status, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      ]);

      setTratamento(tratamentoRes.data);
      setPedidoPendente(pedidoRes.data);
      setAvaliacaoFeita(avaliacaoRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const isTratamentoAtivo = tratamento?.status === 'ativo';
  const hasPendingPayment = pedidoPendente !== null;
  const hasCompletedAssessment = avaliacaoFeita !== null;

  if (loading) {
    return (
      <DashboardLayout>
        <TratamentoSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <FadeInContent>
        <div className="space-y-8">
          <div>
            <h1 className="font-serif text-3xl lg:text-4xl font-semibold text-foreground">
              Tratamento
            </h1>
            <p className="text-muted-foreground mt-2">
              Acompanhe a evolução do seu plano de saúde.
            </p>
          </div>

        {isTratamentoAtivo ? (
          <>
            {/* Treatment Summary */}
            <Card className="card-elevated">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="font-serif text-xl flex items-center gap-2">
                      <Activity className="w-5 h-5 text-teal" />
                      Seu Plano Atual
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {tratamento?.plano || 'Plano personalizado'}
                    </CardDescription>
                  </div>
                  <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-teal/10 text-teal">
                    Ativo
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Data de Início
                    </p>
                    <p className="font-medium">
                      {tratamento?.data_inicio 
                        ? new Date(tratamento.data_inicio).toLocaleDateString('pt-BR')
                        : '-'
                      }
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Próxima Renovação
                    </p>
                    <p className="font-medium">
                      {tratamento?.data_proxima_renovacao 
                        ? new Date(tratamento.data_proxima_renovacao).toLocaleDateString('pt-BR')
                        : '-'
                      }
                    </p>
                  </div>
                </div>

                {tratamento?.observacoes && (
                  <div className="mt-6 p-4 bg-secondary/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Observações</p>
                    <p className="mt-1">{tratamento.observacoes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Document Card */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="font-serif text-xl flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Documentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tratamento?.documento_pdf_url ? (
                  <Button asChild variant="outline">
                    <a href={tratamento.documento_pdf_url} target="_blank" rel="noopener noreferrer">
                      <FileText className="w-4 h-4 mr-2" />
                      Ver Documento de Tratamento (PDF)
                    </a>
                  </Button>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhum documento disponível no momento.
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        ) : hasPendingPayment || hasCompletedAssessment ? (
          /* Has assessment or pending order - Show continue payment CTA */
          <Card className="card-elevated border-2 border-coral/30 bg-gradient-to-br from-coral/5 to-transparent">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-coral/10 flex items-center justify-center mb-6">
                <CreditCard className="w-8 h-8 text-coral" />
              </div>
              <h2 className="font-serif text-2xl font-semibold mb-2">
                Finalize sua compra
              </h2>
              <p className="text-muted-foreground max-w-md mb-4">
                Sua avaliação foi concluída com sucesso! Complete o pagamento para iniciar seu tratamento personalizado.
              </p>
              
              {pedidoPendente && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                  <Clock className="w-4 h-4" />
                  <span>
                    Pedido iniciado em {new Date(pedidoPendente.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
              
              <Button asChild size="lg" variant="coral">
                <Link to="/checkout">
                  Finalizar Pagamento
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              
              <p className="text-xs text-muted-foreground mt-4">
                Você também pode refazer a avaliação se preferir
              </p>
              <Button asChild variant="ghost" size="sm" className="mt-2">
                <Link to="/anamnese">
                  Refazer Avaliação
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* No Treatment - CTA Card */
          <Card className="card-elevated border-2 border-dashed border-primary/20">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-6">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-serif text-2xl font-semibold mb-2">
                Inicie sua jornada
              </h2>
              <p className="text-muted-foreground max-w-md mb-6">
                Faça nossa avaliação clínica para descobrir o melhor tratamento para você. 
                É rápido, seguro e personalizado.
              </p>
              <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Link to="/anamnese">
                  Começar Avaliação
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
          )}
        </div>
      </FadeInContent>
    </DashboardLayout>
  );
}
