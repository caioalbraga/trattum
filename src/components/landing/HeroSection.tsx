import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-wellness.jpg";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export function HeroSection() {
  const navigate = useNavigate();
  const ref = useRef<HTMLElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  // Parallax effect - image moves slower than scroll
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.3]);

  return (
    <section ref={ref} className="relative min-h-[80vh] lg:min-h-[85vh] overflow-hidden">
      {/* Full-width background image container with parallax */}
      <motion.div 
        className="absolute inset-0 w-full h-[120%]"
        style={{ y }}
      >
        <motion.img 
          src={heroImage}
          alt="Mulher saudável acompanhando seu progresso"
          className="w-full h-full object-cover object-center"
          style={{ opacity }}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent lg:via-background/60" />
      </motion.div>

      {/* Content overlay */}
      <div className="container relative z-10 h-full min-h-[80vh] lg:min-h-[85vh] flex items-center">
        <motion.div 
          className="max-w-xl py-16 lg:py-24"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 20,
            delay: 0.2,
          }}
        >
          <motion.h1 
            className="heading-display text-foreground mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 20,
              delay: 0.3,
            }}
          >
            A ciência do<br />
            <span className="italic">emagrecimento</span><br />
            ao seu alcance.
          </motion.h1>
          
          <motion.p 
            className="text-body-lg mb-8 max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 20,
              delay: 0.4,
            }}
          >
            Acesso médico imediato, sem burocracia ou deslocamentos.
            <br /><br />
            Protocolos clínicos rigorosos e medicações de última geração, com acompanhamento especializado em cada etapa.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 20,
              delay: 0.5,
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              variant="hero" 
              size="xl"
              onClick={() => navigate('/pre-anamnese')}
              className="group"
            >
              Iniciar minha Avaliação
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
