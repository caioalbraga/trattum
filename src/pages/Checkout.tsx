import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChevronRight, X, Stethoscope, Loader2, UserCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSubmitAssessment } from "@/hooks/useSubmitAssessment";

type CheckoutStep = 'conta' | 'entrega' | 'pagamento';

interface FormData {
  nome: string;
  sobrenome: string;
  email: string;
  senha: string;
  whatsapp: string;
  dataNascimento: string;
  cpf: string;
  termos: boolean;
}

interface EnderecoData {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
}

export default function Checkout() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { submitAssessment } = useSubmitAssessment();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('conta');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileData, setProfileData] = useState<{ nome?: string; whatsapp?: string; cpf?: string } | null>(null);
  const hasPendingAssessment = typeof window !== 'undefined' && sessionStorage.getItem('pendingQuizAnswers') !== null;

  const [formData, setFormData] = useState<FormData>({
    nome: '',
    sobrenome: '',
    email: '',
    senha: '',
    whatsapp: '',
    dataNascimento: '',
    cpf: '',
    termos: false,
  });

  const [enderecoData, setEnderecoData] = useState<EnderecoData>({
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
  });

  // Load profile data for logged-in users
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('nome, whatsapp, cpf')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (profile) {
        setProfileData(profile);
        // Pre-fill form with profile data
        if (profile.nome) {
          const nameParts = profile.nome.split(' ');
          setFormData(prev => ({
            ...prev,
            nome: nameParts[0] || '',
            sobrenome: nameParts.slice(1).join(' ') || '',
            whatsapp: profile.whatsapp || '',
            cpf: profile.cpf || '',
            email: user.email || '',
          }));
        }
      }
    };

    loadProfile();
  }, [user]);

  // Skip to delivery step if user is logged in
  useEffect(() => {
    if (!authLoading && user) {
      // If user just logged in and has pending assessment, submit it first
      const pendingAnswers = sessionStorage.getItem('pendingQuizAnswers');
      if (pendingAnswers) {
        const answers = JSON.parse(pendingAnswers);
        submitAssessment(answers).then((result) => {
          if (result.success) {
            sessionStorage.removeItem('pendingQuizAnswers');
          }
        });
      }
      setCurrentStep('entrega');
    }
  }, [user, authLoading]);

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEnderecoChange = (field: keyof EnderecoData, value: string) => {
    setEnderecoData(prev => ({ ...prev, [field]: value }));
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create account via Supabase
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.senha,
        options: {
          emailRedirectTo: `${window.location.origin}/checkout`,
          data: {
            full_name: `${formData.nome} ${formData.sobrenome}`.trim(),
          },
        },
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          toast.error('Este e-mail já está cadastrado. Faça login para continuar.');
          navigate('/auth');
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success('Conta criada com sucesso!');
      setCurrentStep('entrega');
    } catch (err) {
      toast.error('Erro ao criar conta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEnderecoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!user) {
        toast.error('Você precisa estar logado para continuar');
        navigate('/auth');
        return;
      }

      // Save address to database
      const { error } = await supabase
        .from('enderecos')
        .upsert({
          user_id: user.id,
          cep: enderecoData.cep,
          logradouro: enderecoData.logradouro,
          numero: enderecoData.numero,
          complemento: enderecoData.complemento,
          bairro: enderecoData.bairro,
          cidade: enderecoData.cidade,
          estado: enderecoData.estado,
          is_default: true,
        });

      if (error) {
        console.error('Error saving address:', error);
        toast.error('Erro ao salvar endereço');
        return;
      }

      toast.success('Endereço salvo!');
      setCurrentStep('pagamento');
    } catch (err) {
      toast.error('Erro ao salvar endereço');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = ['Tratamento', 'Conta', 'Entrega', 'Pagamento'];
  const stepIndex = currentStep === 'conta' ? 1 : currentStep === 'entrega' ? 2 : 3;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <Header />

      <main className="container py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm mb-8">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center">
              <span className={index === stepIndex ? 'font-semibold text-foreground' : 'text-muted-foreground'}>
                {step}
              </span>
              {index < steps.length - 1 && (
                <ChevronRight className="w-4 h-4 mx-2 text-muted-foreground" />
              )}
            </div>
          ))}
        </nav>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Form */}
          <div className="lg:col-span-3">
            <Card className="p-6">
              {currentStep === 'conta' && !user && (
                <>
                  <h2 className="text-xl font-semibold mb-6">1. Crie sua conta</h2>
                  
                  {hasPendingAssessment && (
                    <Alert className="mb-6 border-primary/20 bg-primary/5">
                      <UserCircle className="h-4 w-4 text-primary" />
                      <AlertDescription className="text-sm">
                        <strong>Sua avaliação foi concluída!</strong> Crie sua conta para acompanhar seu tratamento, 
                        visualizar suas consultas e ter acesso exclusivo ao suporte médico pela nossa plataforma.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <form onSubmit={handleAccountSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nome">Nome</Label>
                        <Input
                          id="nome"
                          value={formData.nome}
                          onChange={(e) => handleChange('nome', e.target.value)}
                          className="h-12"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sobrenome">Sobrenome</Label>
                        <Input
                          id="sobrenome"
                          value={formData.sobrenome}
                          onChange={(e) => handleChange('sobrenome', e.target.value)}
                          className="h-12"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        className="h-12"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="senha">Crie uma senha</Label>
                      <Input
                        id="senha"
                        type="password"
                        value={formData.senha}
                        onChange={(e) => handleChange('senha', e.target.value)}
                        className="h-12"
                        required
                        minLength={6}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">WhatsApp</Label>
                      <Input
                        id="whatsapp"
                        type="tel"
                        placeholder="(11) 99999-9999"
                        value={formData.whatsapp}
                        onChange={(e) => handleChange('whatsapp', e.target.value)}
                        className="h-12"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dataNascimento">Data de nascimento (DD/MM/AAAA)</Label>
                      <Input
                        id="dataNascimento"
                        placeholder="DD/MM/AAAA"
                        value={formData.dataNascimento}
                        onChange={(e) => handleChange('dataNascimento', e.target.value)}
                        className="h-12"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Necessário para análise médica e prescrição do tratamento.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cpf">CPF</Label>
                      <Input
                        id="cpf"
                        placeholder="000.000.000-00"
                        value={formData.cpf}
                        onChange={(e) => handleChange('cpf', e.target.value)}
                        className="h-12"
                        required
                      />
                    </div>

                    <div className="flex items-start space-x-2 pt-4">
                      <Checkbox
                        id="termos"
                        checked={formData.termos}
                        onCheckedChange={(checked) => handleChange('termos', checked as boolean)}
                      />
                      <Label htmlFor="termos" className="text-sm leading-relaxed cursor-pointer">
                        Eu concordo com{" "}
                        <a href="#" className="text-primary hover:underline">Termos & Condições</a>
                        {" "}e com a{" "}
                        <a href="#" className="text-primary hover:underline">Política de Privacidade</a>
                      </Label>
                    </div>

                    <Button
                      type="submit"
                      variant="coral"
                      size="lg"
                      className="w-full mt-6"
                      disabled={!formData.termos || isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Criando conta...
                        </>
                      ) : (
                        'Continuar para entrega'
                      )}
                    </Button>
                  </form>
                </>
              )}

              {currentStep === 'entrega' && (
                <>
                  <h2 className="text-xl font-semibold mb-6">2. Endereço de entrega</h2>
                  <form onSubmit={handleEnderecoSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cep">CEP</Label>
                        <Input
                          id="cep"
                          placeholder="00000-000"
                          value={enderecoData.cep}
                          onChange={(e) => handleEnderecoChange('cep', e.target.value)}
                          className="h-12"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="logradouro">Logradouro</Label>
                        <Input
                          id="logradouro"
                          placeholder="Rua, Avenida, etc."
                          value={enderecoData.logradouro}
                          onChange={(e) => handleEnderecoChange('logradouro', e.target.value)}
                          className="h-12"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="numero">Número</Label>
                        <Input
                          id="numero"
                          placeholder="123"
                          value={enderecoData.numero}
                          onChange={(e) => handleEnderecoChange('numero', e.target.value)}
                          className="h-12"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="complemento">Complemento (opcional)</Label>
                      <Input
                        id="complemento"
                        placeholder="Apto, Bloco, etc."
                        value={enderecoData.complemento}
                        onChange={(e) => handleEnderecoChange('complemento', e.target.value)}
                        className="h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bairro">Bairro</Label>
                      <Input
                        id="bairro"
                        value={enderecoData.bairro}
                        onChange={(e) => handleEnderecoChange('bairro', e.target.value)}
                        className="h-12"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="cidade">Cidade</Label>
                        <Input
                          id="cidade"
                          value={enderecoData.cidade}
                          onChange={(e) => handleEnderecoChange('cidade', e.target.value)}
                          className="h-12"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="estado">Estado</Label>
                        <Input
                          id="estado"
                          placeholder="SP"
                          maxLength={2}
                          value={enderecoData.estado}
                          onChange={(e) => handleEnderecoChange('estado', e.target.value.toUpperCase())}
                          className="h-12"
                          required
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      variant="coral"
                      size="lg"
                      className="w-full mt-6"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        'Continuar para pagamento'
                      )}
                    </Button>
                  </form>
                </>
              )}

              {currentStep === 'pagamento' && (
                <>
                  <h2 className="text-xl font-semibold mb-6">3. Pagamento</h2>
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      Integração de pagamento será implementada em breve.
                    </p>
                  </div>
                </>
              )}
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-2">
            <Card className="p-6 sticky top-24">
              <h2 className="font-semibold mb-2">Resumo da compra</h2>
              <p className="text-sm text-muted-foreground mb-6">3 meses de tratamento</p>

              <div className="flex gap-4 pb-4 border-b">
                <div className="w-16 h-20 bg-secondary rounded-lg flex items-center justify-center">
                  <span className="text-2xl">💉</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Wegovy</h3>
                  <p className="text-xs text-muted-foreground">Tratamento para um mês</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">R$ 910,00/mês</p>
                  <p className="text-xs text-muted-foreground line-through">R$ 1300,00/mês</p>
                </div>
              </div>

              <div className="flex gap-4 py-4 border-b">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">Avaliação Médica</h3>
                  <p className="text-xs text-muted-foreground">(assíncrona)</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">R$ 10,00</p>
                </div>
              </div>

              <div className="space-y-3 py-4 text-sm">
                <div className="flex justify-between text-primary">
                  <span className="flex items-center gap-2">
                    30% desconto no primeiro pedido
                    <X className="w-4 h-4 cursor-pointer hover:text-destructive" />
                  </span>
                  <span>-R$ 390,00</span>
                </div>

                <div className="flex justify-between">
                  <span>Entrega</span>
                  <span className="text-primary">Grátis</span>
                </div>

                <div className="flex justify-between">
                  <span>Presente MANUAL</span>
                  <span className="text-primary">-R$ 10,00</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="font-bold text-lg">Total</span>
                    <span className="text-sm text-muted-foreground ml-2">(1 mês de tratamento)</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xl">R$ 910,00</p>
                    <p className="text-xs text-muted-foreground">Valor do plano</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
