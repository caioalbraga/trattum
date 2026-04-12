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
import { ChevronRight, Loader2, UserCircle, CreditCard, Lock, ShieldCheck, Package } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSubmitAssessment } from "@/hooks/useSubmitAssessment";
import { encryptProfile, encryptEndereco } from "@/lib/crypto-client";
import { useConsent } from "@/hooks/useConsent";

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
  const { hasValidConsent, isLoading: consentLoading, isChecking: consentChecking, acceptConsent } = useConsent();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('conta');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [medicacaoConsent, setMedicacaoConsent] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [packagePrice, setPackagePrice] = useState<number | null>(null);
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

  // Load package price and user data
  useEffect(() => {
    const loadData = async () => {
      // Always fetch package price from DB
      const { data: produto } = await supabase
        .from('configuracoes_produtos')
        .select('preco')
        .eq('ativo', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      setPackagePrice(produto?.preco ?? 0);

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

        const hasAddress = address && address.cep && address.logradouro;
        setCurrentStep(hasAddress ? 'pagamento' : 'entrega');

      } catch (err) {
        console.error('Error loading user data:', err);
      } finally {
        setIsLoadingData(false);
      }
    };

    if (!authLoading) {
      loadData();
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

      // Update profile with additional data (encrypted)
      const { data: { user: newUser } } = await supabase.auth.getUser();
      if (newUser) {
        const encryptedProfile = await encryptProfile({
          nome: `${formData.nome} ${formData.sobrenome}`.trim(),
          whatsapp: formData.whatsapp,
          cpf: formData.cpf,
        });
        await supabase.from('profiles').update(encryptedProfile).eq('user_id', newUser.id);
      }

      // Register consent since user accepted terms checkbox during signup
      if (formData.termos) {
        await acceptConsent();
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

      // Save or update address (encrypted)
      const encryptedAddress = await encryptEndereco({
        cep: enderecoData.cep,
        logradouro: enderecoData.logradouro,
        numero: enderecoData.numero,
        complemento: enderecoData.complemento,
        bairro: enderecoData.bairro,
        cidade: enderecoData.cidade,
      });
      const { error } = await supabase
        .from('enderecos')
        .upsert({
          ...encryptedAddress,
          user_id: user.id,
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
        const { data: newOrder, error: orderError } = await supabase
          .from('pedidos')
          .insert({
            user_id: user.id,
            valor: packagePrice,
            status: 'pendente',
            descricao: 'Pacote Trattum',
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
        await supabase
          .from('pedidos')
          .insert({
            user_id: user.id,
            valor: packagePrice,
            status: 'pago',
            descricao: 'Pacote Trattum',
          });
      }

      // Update treatment status
      await supabase
        .from('tratamentos')
        .update({
          status: 'processamento',
          plano: 'Pacote Trattum',
          data_inicio: new Date().toISOString().split('T')[0],
          data_proxima_renovacao: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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

  const handleMedicacaoConsent = async () => {
    try {
      // Record the medication consent in user_consents
      if (user) {
        const now = new Date().toISOString();
        await supabase.from('user_consents').upsert([
          { user_id: user.id, termo: 'termo_de_responsabilidade_medicacao', aceito: true, aceito_em: now },
        ], { onConflict: 'user_id,termo' });
      }
      // Then accept the general consent (existing flow)
      await acceptConsent();
    } catch {
      await acceptConsent();
    }
  };

  const stepIndex = currentStep === 'conta' ? 1 : currentStep === 'entrega' ? 2 : 3;

  const displayPrice = packagePrice ?? 0;

  if (authLoading || isLoadingData || packagePrice === null) {
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
                        Li e concordo com os{" "}
                        <a href="/termos" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Termos de Uso e Política de Privacidade</a>
                        {" "}e autorizo o uso dos meus dados para fins de acompanhamento de saúde, conforme a LGPD.
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

              {currentStep === 'entrega' && !hasValidConsent && !consentChecking && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold mb-2">Consentimento necessário</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Antes de continuar, precisamos do seu consentimento para uso da medicação.
                  </p>
                  <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="consent-medicacao"
                        checked={medicacaoConsent}
                        onChange={(e) => setMedicacaoConsent(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <label htmlFor="consent-medicacao" className="text-sm text-foreground leading-relaxed cursor-pointer">
                        Li e concordo com o{" "}
                        <a href="/termos/termo-de-responsabilidade-medicacao" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                          Termo de Responsabilidade pelo Uso da Medicação
                        </a>
                      </label>
                    </div>
                    <Button
                      onClick={handleMedicacaoConsent}
                      disabled={!medicacaoConsent || consentLoading}
                      className="w-full"
                    >
                      {consentLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Registrando...
                        </>
                      ) : (
                        'Continuar'
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {currentStep === 'entrega' && (hasValidConsent || consentChecking) && (
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
                          {[1,2,3,4,5,6].map(n => (
                            <SelectItem key={n} value={String(n)}>
                              {n}x de R$ {(displayPrice / n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (sem juros)
                            </SelectItem>
                          ))}
                          {[7,8,9,10,11,12].map(n => (
                            <SelectItem key={n} value={String(n)}>
                              {n}x de R$ {(displayPrice * 1.03 / n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (com juros)
                            </SelectItem>
                          ))}
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
                        `Pagar R$ ${displayPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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
              <p className="text-sm text-muted-foreground mb-6">Pacote completo de tratamento</p>

              <div className="flex gap-4 pb-4 border-b">
                <div className="w-16 h-20 bg-secondary rounded-lg flex items-center justify-center">
                  <Package className="w-7 h-7 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Pacote Trattum</h3>
                  <p className="text-xs text-muted-foreground">Medicamentos + Acompanhamento clínico</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    R$ {displayPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="space-y-3 py-4 text-sm">
                <div className="flex justify-between">
                  <span>Entrega</span>
                  <span className="text-primary">Grátis</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-lg">Total</span>
                  <p className="font-bold text-xl">
                    R$ {displayPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
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
