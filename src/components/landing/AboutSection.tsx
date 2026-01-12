import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, MessageCircle, Pill, ArrowRight } from "lucide-react";

const features = [
  "Avaliação médica assíncrona",
  "Medicamentos entregues na sua porta com frete gratuito, se prescritos",
  "Suporte contínuo com o time de especialistas",
];

export function AboutSection() {
  const navigate = useNavigate();

  return (
    <section className="py-24 bg-muted/20">
      <div className="container">
        <div className="text-center mb-4">
          <span className="text-xs font-medium tracking-widest text-primary/70 uppercase">
            Sobre a VidaSaúde
          </span>
        </div>
        
        <h2 className="heading-section text-foreground text-center mb-4 max-w-3xl mx-auto">
          Cuidado completo e descomplicado
        </h2>
        
        <p className="text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
          Nós gerenciamos o seu tratamento e cuidamos de tudo para que você possa se cuidar com tranquilidade.
          Pela VidaSaúde, você está conectado a médicos especializados, farmácias parceiras e conta com suporte clínico sempre que precisar.
        </p>

        <div className="text-center mb-8">
          <h3 className="text-xl font-serif font-medium text-foreground">
            Opções de Planos
          </h3>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Main Plan Card */}
          <div className="lg:col-span-2 bg-card rounded-2xl overflow-hidden border border-border/30 shadow-sm">
            <div className="aspect-[16/9] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <img 
                src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80"
                alt="Tratamento completo"
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="p-6">
              <h4 className="font-semibold text-lg text-foreground mb-2">
                Cuidado Completo
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                Diagnóstico médico, medicamentos prescritos e suporte clínico ilimitado
              </p>

              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">
                Está incluso
              </p>

              <ul className="space-y-2 mb-6">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-foreground">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button 
                variant="hero" 
                className="w-full group"
                onClick={() => navigate('/assessment')}
              >
                Começar avaliação
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>

          {/* Side Cards */}
          <div className="flex flex-col gap-6">
            <div className="bg-card rounded-2xl p-6 border border-border/30 shadow-sm flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-primary mb-1">
                    Consulta Médica Avulsa
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Avaliação assíncrona realizada por um médico credenciado.
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-6 h-6 text-primary" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Esta opção está disponível para ser selecionada ao configurar suas preferências de plano de tratamento
              </p>
            </div>

            <div className="bg-card rounded-2xl p-6 border border-border/30 shadow-sm flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-1">
                    Farmácia Online
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Caso você já tenha uma prescrição médica, pode comprar seus medicamentos através de uma farmácia parceira VidaSaúde
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                  <Pill className="w-6 h-6 text-primary-foreground" />
                </div>
              </div>
              <button className="text-primary text-sm font-medium hover:underline inline-flex items-center gap-1">
                Começar <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
