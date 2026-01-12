import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";

const benefits = [
  "Redução de 15-20% do peso corporal em até 6 meses",
  "Regulação hormonal e controle da saciedade",
  "Melhora significativa dos marcadores metabólicos",
  "Monitoramento clínico contínuo e ajustes de protocolo",
  "Logística discreta com entrega domiciliar",
  "Canal de suporte disponível 7 dias por semana",
];

export function TreatmentShowcase() {
  const navigate = useNavigate();

  return (
    <section className="py-24 bg-muted/30">
      <div className="container">
        <div className="text-center mb-4">
          <span className="text-xs font-medium tracking-widest text-primary/70 uppercase">
            Programa Clínico
          </span>
        </div>
        
        <h2 className="heading-section text-foreground text-center mb-16 max-w-3xl mx-auto">
          Transformação metabólica duradoura com respaldo científico
        </h2>

        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Product Image */}
          <div className="relative">
            <div className="aspect-square bg-gradient-to-br from-secondary/80 to-secondary/40 rounded-3xl overflow-hidden flex items-center justify-center">
              <img 
                src="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80"
                alt="Tratamento para gerenciamento metabólico"
                className="w-3/4 h-3/4 object-contain drop-shadow-xl"
              />
            </div>
            
            {/* Floating badge */}
            <div className="absolute -bottom-4 -right-4 bg-card rounded-2xl shadow-lg p-4 border border-border/30">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Check className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Autorizado</p>
                  <p className="text-xs text-muted-foreground">pela Anvisa</p>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div>
            <h3 className="text-2xl font-serif font-medium text-foreground mb-4">
              Programa de Gerenciamento Metabólico
            </h3>
            
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Nosso protocolo integra medicações de alta eficácia com acompanhamento médico especializado. 
              Focamos na regulação hormonal e no controle de saciedade para uma transformação sustentável e segura.
            </p>

            <ul className="space-y-4 mb-8">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-foreground">{benefit}</span>
                </li>
              ))}
            </ul>

            <Button 
              variant="hero" 
              size="lg"
              onClick={() => navigate('/assessment')}
              className="group"
            >
              Verificar Elegibilidade
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
