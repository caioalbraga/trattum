import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { ChevronRight, X, Stethoscope } from "lucide-react";

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

export default function Checkout() {
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

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Integrate with Supabase auth - form data is processed securely
  };

  const steps = ['Tratamento', 'Conta', 'Entrega', 'Pagamento'];

  return (
    <div className="min-h-screen bg-muted">
      <Header />

      <main className="container py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm mb-8">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center">
              <span className={index === 1 ? 'font-semibold text-foreground' : 'text-muted-foreground'}>
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
              <h2 className="text-xl font-semibold mb-6">1. Crie sua conta</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
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
                  disabled={!formData.termos}
                >
                  Continuar para entrega
                </Button>
              </form>
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
