import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { ArrowRight, CheckCircle, Shield, Users, Clock } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Avaliação Médica",
    description: "Médicos especializados analisam seu perfil para recomendar o melhor tratamento.",
  },
  {
    icon: Users,
    title: "Acompanhamento Completo",
    description: "Nutricionistas e time clínico disponíveis para te apoiar em cada passo.",
  },
  {
    icon: Clock,
    title: "Resultados Rápidos",
    description: "Veja mudanças reais em poucas semanas com nosso programa personalizado.",
  },
];

const stats = [
  { value: "20kg", label: "Perda média em 6 meses" },
  { value: "94%", label: "Taxa de satisfação" },
  { value: "10k+", label: "Pacientes atendidos" },
];

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/50 via-background to-background" />
        
        <div className="container relative py-20 sm:py-32">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-semibold tracking-tight text-foreground mb-6 animate-slide-up">
              Emagreça com{" "}
              <span className="text-primary">acompanhamento médico</span>
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Tratamentos personalizados para obesidade com suporte de médicos, nutricionistas e um time clínico dedicado ao seu sucesso.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Button 
                variant="hero" 
                onClick={() => navigate('/assessment')}
                className="group"
              >
                Começar avaliação gratuita
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-primary" /> Avaliação 100% online
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-primary" /> Médicos certificados
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-primary" /> Entrega grátis
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y bg-card">
        <div className="container">
          <div className="grid grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-3xl sm:text-4xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-semibold mb-4">
              Como funciona
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Um programa completo de emagrecimento com tudo que você precisa para alcançar seus objetivos.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-card rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-shadow"
              >
                <div className="icon-container mb-4">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl font-serif font-semibold mb-4">
            Pronto para transformar sua vida?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Faça uma avaliação gratuita e descubra o melhor tratamento para você. Leva apenas 3 minutos.
          </p>
          <Button
            variant="secondary"
            size="xl"
            onClick={() => navigate('/assessment')}
            className="group"
          >
            Começar agora
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container text-center text-sm text-muted-foreground">
          <p>&copy; 2026 VidaSaúde. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
