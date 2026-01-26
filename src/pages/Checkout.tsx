import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronRight, X, Stethoscope, Loader2, UserCircle, CreditCard, Lock, ShieldCheck } from "lucide-react";
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

interface PagamentoData {
  numeroCartao: string;
  nomeCartao: string;
  validade: string;
  cvv: string;
  parcelas: string;
  cpfTitular: string;
}

export default function Checkout() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { submitAssessment } = useSubmitAssessment();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('conta');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [profileData, setProfileData] = useState<{ nome?: string; whatsapp?: string; cpf?: string } | null>(null);
  const [existingAddress, setExistingAddress] = useState<EnderecoData | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
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

  const [pagamentoData, setPagamentoData] = useState<PagamentoData>({
    numeroCartao: '',
    nomeCartao: '',
    validade: '',
    cvv: '',
    parcelas: '1',
    cpfTitular: '',
  });

  // Load user data and determine where to resume
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) {
        setIsLoadingData(false);
        return;
      }

      setIsLoadingData(true);

      try {
        // Submit pending assessment if exists
        const pendingAnswers = sessionStorage.getItem('pendingQuizAnswers');
        if (pendingAnswers) {
          const answers = JSON.parse(pendingAnswers);
          const result = await submitAssessment(answers);
          if (result.success) {
            sessionStorage.removeItem('pendingQuizAnswers');
            sessionStorage.removeItem('pendingAssessmentPreview');
          }
        }

        // Load profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('nome, whatsapp, cpf')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profile) {
          setProfileData(profile);
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
            // Pre-fill CPF for payment if available
            if (profile.cpf) {
              setPagamentoData(prev => ({ ...prev, cpfTitular: profile.cpf || '' }));
            }
          }
        }

        // Load existing address
        const { data: address } = await supabase
          .from('enderecos')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_default', true)
          .maybeSingle();

        if (address) {
          const addr: EnderecoData = {
            cep: address.cep || '',
            logradouro: address.logradouro || '',
            numero: address.numero || '',
            complemento: address.complemento || '',
            bairro: address.bairro || '',
            cidade: address.cidade || '',
            estado: address.estado || '',
          };
          setExistingAddress(addr);
          setEnderecoData(addr);
        }

        // Check for pending orders to resume
        const { data: pendingOrder } = await supabase
          .from('pedidos')
          .select('id, status')
          .eq('user_id', user.id)
          .eq('status', 'pendente')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (pendingOrder) {
          setPendingOrderId(pendingOrder.id);
        }

        // Determine which step to show based on existing data
        const hasAddress = address && address.cep && address.logradouro;
        
        if (hasAddress) {
          // User has address, go to payment
          setCurrentStep('pagamento');
        } else {
          // User needs to add address
          setCurrentStep('entrega');
        }

      } catch (err) {
        console.error('Error loading user data:', err);
      } finally {
        setIsLoadingData(false);
      }
    };

    if (!authLoading) {
      loadUserData();
    }
  }, [user, authLoading]);

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEnderecoChange = (field: keyof EnderecoData, value: string) => {
    setEnderecoData(prev => ({ ...prev, [field]: value }));
  };

  const handlePagamentoChange = (field: keyof PagamentoData, value: string) => {
    setPagamentoData(prev => ({ ...prev, [field]: value }));
  };

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 16);
    return numbers.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  // Format expiry date
  const formatExpiry = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 4);
    if (numbers.length >= 2) {
      return numbers.slice(0, 2) + '/' + numbers.slice(2);
    }
    return numbers;
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
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

      // Update profile with additional data
      const { data: { user: newUser } } = await supabase.auth.getUser();
      if (newUser) {
        await supabase.from('profiles').update({
          nome: `${formData.nome} ${formData.sobrenome}`.trim(),
          whatsapp: formData.whatsapp,
          cpf: formData.cpf,
        }).eq('user_id', newUser.id);
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

      // Save or update address
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

      // Create or update pending order
      if (!pendingOrderId) {
        const treatment = sessionStorage.getItem('selectedTreatment') || 'wegovy';
        const { data: newOrder, error: orderError } = await supabase
          .from('pedidos')
          .insert({
            user_id: user.id,
            valor: 910.00,
            status: 'pendente',
            descricao: `Tratamento ${treatment} - 1 mês`,
          })
          .select('id')
          .single();

        if (!orderError && newOrder) {
          setPendingOrderId(newOrder.id);
        }
      }

      toast.success('Endereço salvo!');
      setCurrentStep('pagamento');
    } catch (err) {
      toast.error('Erro ao salvar endereço');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePagamentoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!user) {
        toast.error('Você precisa estar logado para continuar');
        navigate('/auth');
        return;
      }

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update order status to paid
      const orderId = pendingOrderId;
      if (orderId) {
        await supabase
          .from('pedidos')
          .update({ status: 'pago' })
          .eq('id', orderId);
      } else {
        // Create order if doesn't exist
        const treatment = sessionStorage.getItem('selectedTreatment') || 'wegovy';
        await supabase
          .from('pedidos')
          .insert({
            user_id: user.id,
            valor: 910.00,
            status: 'pago',
            descricao: `Tratamento ${treatment} - 1 mês`,
          });
      }

      // Update treatment status
      await supabase
        .from('tratamentos')
        .update({
          status: 'ativo',
          plano: sessionStorage.getItem('selectedTreatment') || 'wegovy',
          data_inicio: new Date().toISOString().split('T')[0],
          data_proxima_renovacao: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        })
        .eq('user_id', user.id);

      // Clear session data
      sessionStorage.removeItem('selectedTreatment');
      sessionStorage.removeItem('assessmentId');

      toast.success('Pagamento aprovado! Bem-vindo ao seu tratamento.');
      navigate('/dashboard');
    } catch (err) {
      console.error('Payment error:', err);
      toast.error('Erro ao processar pagamento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = ['Tratamento', 'Conta', 'Entrega', 'Pagamento'];
  const stepIndex = currentStep === 'conta' ? 1 : currentStep === 'entrega' ? 2 : 3;

  if (authLoading || isLoadingData) {
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
                  
                  {existingAddress && existingAddress.cep && (
                    <Alert className="mb-6 border-emerald-200 bg-emerald-50">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      <AlertDescription className="text-sm text-emerald-800">
                        Encontramos seu endereço salvo. Você pode editá-lo ou continuar para o pagamento.
                      </AlertDescription>
                    </Alert>
                  )}
                  
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
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">3. Pagamento</h2>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Lock className="w-4 h-4" />
                      <span>Ambiente seguro</span>
                    </div>
                  </div>

                  {/* Card Brands */}
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b">
                    <span className="text-sm text-muted-foreground">Aceitamos:</span>
                    <div className="flex gap-2">
                      <div className="w-10 h-6 bg-gradient-to-r from-blue-600 to-blue-800 rounded text-white text-[8px] font-bold flex items-center justify-center">VISA</div>
                      <div className="w-10 h-6 bg-gradient-to-r from-red-500 to-yellow-500 rounded text-white text-[8px] font-bold flex items-center justify-center">MC</div>
                      <div className="w-10 h-6 bg-gradient-to-r from-blue-400 to-blue-600 rounded text-white text-[8px] font-bold flex items-center justify-center">ELO</div>
                      <div className="w-10 h-6 bg-gradient-to-r from-green-500 to-green-700 rounded text-white text-[8px] font-bold flex items-center justify-center">AMEX</div>
                    </div>
                  </div>

                  <form onSubmit={handlePagamentoSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="numeroCartao">Número do cartão</Label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="numeroCartao"
                          placeholder="0000 0000 0000 0000"
                          value={pagamentoData.numeroCartao}
                          onChange={(e) => handlePagamentoChange('numeroCartao', formatCardNumber(e.target.value))}
                          className="h-12 pl-10"
                          maxLength={19}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nomeCartao">Nome impresso no cartão</Label>
                      <Input
                        id="nomeCartao"
                        placeholder="NOME COMPLETO"
                        value={pagamentoData.nomeCartao}
                        onChange={(e) => handlePagamentoChange('nomeCartao', e.target.value.toUpperCase())}
                        className="h-12"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="validade">Validade</Label>
                        <Input
                          id="validade"
                          placeholder="MM/AA"
                          value={pagamentoData.validade}
                          onChange={(e) => handlePagamentoChange('validade', formatExpiry(e.target.value))}
                          className="h-12"
                          maxLength={5}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cvv">CVV</Label>
                        <Input
                          id="cvv"
                          type="password"
                          placeholder="•••"
                          value={pagamentoData.cvv}
                          onChange={(e) => handlePagamentoChange('cvv', e.target.value.replace(/\D/g, '').slice(0, 4))}
                          className="h-12"
                          maxLength={4}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cpfTitular">CPF do titular do cartão</Label>
                      <Input
                        id="cpfTitular"
                        placeholder="000.000.000-00"
                        value={pagamentoData.cpfTitular}
                        onChange={(e) => handlePagamentoChange('cpfTitular', e.target.value)}
                        className="h-12"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="parcelas">Parcelas</Label>
                      <Select
                        value={pagamentoData.parcelas}
                        onValueChange={(value) => handlePagamentoChange('parcelas', value)}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Selecione o número de parcelas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1x de R$ 910,00 (sem juros)</SelectItem>
                          <SelectItem value="2">2x de R$ 455,00 (sem juros)</SelectItem>
                          <SelectItem value="3">3x de R$ 303,33 (sem juros)</SelectItem>
                          <SelectItem value="4">4x de R$ 227,50 (sem juros)</SelectItem>
                          <SelectItem value="5">5x de R$ 182,00 (sem juros)</SelectItem>
                          <SelectItem value="6">6x de R$ 151,67 (sem juros)</SelectItem>
                          <SelectItem value="7">7x de R$ 137,14 (com juros)</SelectItem>
                          <SelectItem value="8">8x de R$ 121,25 (com juros)</SelectItem>
                          <SelectItem value="9">9x de R$ 109,11 (com juros)</SelectItem>
                          <SelectItem value="10">10x de R$ 99,00 (com juros)</SelectItem>
                          <SelectItem value="11">11x de R$ 91,00 (com juros)</SelectItem>
                          <SelectItem value="12">12x de R$ 84,17 (com juros)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Security Notice */}
                    <div className="flex items-start gap-3 p-4 bg-muted rounded-lg mt-6">
                      <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-foreground">Compra 100% segura</p>
                        <p className="text-muted-foreground">
                          Seus dados são protegidos com criptografia de ponta a ponta. 
                          Não armazenamos os dados do seu cartão.
                        </p>
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
                          Processando pagamento...
                        </>
                      ) : (
                        `Pagar R$ 910,00`
                      )}
                    </Button>
                  </form>
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

              {/* Payment Method Hint */}
              {currentStep === 'pagamento' && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground text-center">
                    Parcelamento em até 12x no cartão de crédito
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
