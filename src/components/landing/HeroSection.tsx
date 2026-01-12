import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[85vh] flex items-center">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Text Content */}
          <div className="order-2 lg:order-1 max-w-xl">
            <h1 className="heading-display text-foreground mb-6">
              Saúde e<br />
              <span className="italic">emagrecimento</span><br />
              do jeito que você precisa.
            </h1>
            
            <p className="text-body-lg mb-8 max-w-md">
              Sem salas de espera ou conversas constrangedoras.
              <br /><br />
              Apenas tratamentos baseados na ciência, entregues direto na sua porta, e com acompanhamento durante todo o processo.
            </p>

            <Button 
              variant="hero" 
              size="xl"
              onClick={() => navigate('/assessment')}
              className="group"
            >
              Começar agora
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Hero Image */}
          <div className="order-1 lg:order-2 relative">
            <div className="aspect-[4/5] lg:aspect-[3/4] bg-muted rounded-3xl overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80"
                alt="Homem saudável e confiante"
                className="w-full h-full object-cover object-top"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
