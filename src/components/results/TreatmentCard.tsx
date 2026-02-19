import { TreatmentRecommendation } from "@/types/assessment";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Package, Sparkles, Shield } from "lucide-react";
import { motion } from "framer-motion";

interface TreatmentCardProps {
  treatment: TreatmentRecommendation;
  onSelect: () => void;
}

export function TreatmentCard({ treatment, onSelect }: TreatmentCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 100,
        damping: 20,
        delay: 0.3,
      }}
      whileHover={{ 
        y: -4,
        transition: { type: "spring", stiffness: 400, damping: 25 }
      }}
      className="treatment-card-hover"
    >
      <Card className="overflow-hidden card-elevated">
        {/* Recommended banner */}
        <motion.div 
          className="bg-foreground text-background text-center py-3 text-sm font-semibold tracking-wide"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          ✦ Recomendado para você ✦
        </motion.div>
        
        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6">
            <motion.div 
              className="icon-container shrink-0"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.4 }}
            >
              <Package className="w-6 h-6" />
            </motion.div>
            <div className="flex-1">
              <h3 className="font-serif text-xl font-medium mb-1">{treatment.name}</h3>
              <p className="text-muted-foreground text-sm">{treatment.description}</p>
              
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mt-3">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.5 }}
                >
                  <Badge variant="secondary" className="gap-1.5 px-3 py-1 font-normal">
                    <Sparkles className="w-3 h-3" />
                    Tratamento completo
                  </Badge>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.6 }}
                >
                  <Badge variant="secondary" className="gap-1.5 px-3 py-1 font-normal">
                    <Shield className="w-3 h-3" />
                    Acompanhamento dedicado
                  </Badge>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Price section */}
          <motion.div 
            className="bg-secondary/40 rounded-xl p-4 mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Valor do pacote</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-serif font-medium text-foreground">
                    R$ {treatment.price.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Features list */}
          <div className="border-t border-border/60 pt-6">
            <p className="font-semibold mb-4 text-sm uppercase tracking-wide text-muted-foreground">
              Pacote Trattum inclui
            </p>
            <ul className="space-y-3">
              {treatment.features.map((feature, index) => (
                <motion.li 
                  key={index} 
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ 
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                    delay: 0.7 + index * 0.05 
                  }}
                >
                  <div className="w-5 h-5 rounded-full bg-teal/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-teal" />
                  </div>
                  <span className="text-foreground">{feature}</span>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Price summary */}
          <motion.div 
            className="mt-8 pt-6 border-t border-border/60 space-y-3 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <div className="flex justify-between">
              <span className="text-muted-foreground">Frete</span>
              <span className="text-teal font-medium">Grátis</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-3 border-t border-border/60">
              <span>Total</span>
              <span>R$ {treatment.price.toFixed(2).replace('.', ',')}</span>
            </div>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              variant="coral" 
              className="w-full mt-8" 
              size="lg" 
              onClick={onSelect}
            >
              Iniciar tratamento
            </Button>
          </motion.div>

          {/* Trust badges */}
          <motion.p 
            className="text-center text-xs text-muted-foreground mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
          >
            Entrega grátis • Suporte 24h
          </motion.p>
        </div>
      </Card>
    </motion.div>
  );
}
