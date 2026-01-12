import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-wellness.jpg";

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[80vh] lg:min-h-[85vh]">
      {/* Full-width background image container */}
      <div className="absolute inset-0 w-full h-full">
        <img 
          src={heroImage}
          alt="Mulher saudável acompanhando seu progresso"
          className="w-full h-full object-cover object-center"
        />
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent lg:via-background/60" />
      </div>

      {/* Content overlay */}
      <div className="container relative z-10 h-full min-h-[80vh] lg:min-h-[85vh] flex items-center">
        <div className="max-w-xl py-16 lg:py-24">
          <h1 className="heading-display text-foreground mb-6">
            A ciência do<br />
            <span className="italic">emagrecimento</span><br />
            ao seu alcance.
          </h1>
          
          <p className="text-body-lg mb-8 max-w-md">
            Acesso médico imediato, sem burocracia ou deslocamentos.
            <br /><br />
            Protocolos clínicos rigorosos e medicações de última geração, com acompanhamento especializado em cada etapa.
          </p>

          <Button 
            variant="hero" 
            size="xl"
            onClick={() => navigate('/assessment')}
            className="group"
          >
            Iniciar meu Diagnóstico
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
}
