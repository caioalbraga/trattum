import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";

const features = [
  "Avaliação clínica conduzida por médicos habilitados.",
  "Medicações prescritas e entregues com discrição.",
  "Acompanhamento clínico via chat durante o tratamento.",
];

export function AboutSection() {
  const navigate = useNavigate();

  return (
    <section id="about-section" className="py-24 bg-muted/20">
      <div className="container">
        <div className="text-center mb-4">
          <span className="text-xs font-medium tracking-widest text-primary/70 uppercase">
            Sobre a Trattum
          </span>
        </div>
        
        <h2 className="heading-section text-foreground text-center mb-4 max-w-3xl mx-auto">
          Estrutura Clínica Integrada
        </h2>
        
        <p className="text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
          Da avaliação diagnóstica ao recebimento das medicações em domicílio.
        </p>

        <div className="text-center mb-8">
          <h3 className="text-xl font-serif font-medium text-foreground">
            Estrutura Clínica Integrada
          </h3>
        </div>

        <div className="max-w-3xl mx-auto">
          {/* Main Plan Card */}
          <div className="bg-card rounded-2xl overflow-hidden border border-border/30 shadow-sm">
            <div className="aspect-[16/9] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <img 
                src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80"
                alt="Programa de tratamento integrado"
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="p-6">
              <h4 className="font-semibold text-lg text-foreground mb-2">
                Estrutura Clínica Integrada
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                Da avaliação diagnóstica ao recebimento das medicações em domicílio.
              </p>

              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">
                Incluso no programa
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
                onClick={() => navigate('/pre-anamnese')}
              >
                Iniciar minha Avaliação
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
