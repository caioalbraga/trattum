import { TreatmentRecommendation } from "@/types/assessment";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Syringe, Pill, Leaf, Sparkles, Shield } from "lucide-react";

interface TreatmentCardProps {
  treatment: TreatmentRecommendation;
  onSelect: () => void;
}

const treatmentIcons = {
  injectable: Syringe,
  oral: Pill,
  lifestyle: Leaf,
};

const treatmentBadges = {
  injectable: [
    { text: 'Maior eficácia', icon: Sparkles },
    { text: 'Reduz apetite', icon: Shield },
  ],
  oral: [
    { text: 'Fácil de usar', icon: Sparkles },
    { text: 'Sem injeção', icon: Shield },
  ],
  lifestyle: [
    { text: 'Natural', icon: Sparkles },
    { text: 'Sustentável', icon: Shield },
  ],
};

export function TreatmentCard({ treatment, onSelect }: TreatmentCardProps) {
  const Icon = treatmentIcons[treatment.type];
  const badges = treatmentBadges[treatment.type];
  const discount = Math.round((1 - treatment.price / treatment.originalPrice) * 100);

  return (
    <Card className="overflow-hidden card-elevated">
      {/* Recommended banner */}
      <div className="bg-foreground text-background text-center py-3 text-sm font-semibold tracking-wide">
        ✦ Recomendado para você ✦
      </div>
      
      <div className="p-6 sm:p-8">
        {/* Header with icon and badges */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6">
          <div className="icon-container shrink-0">
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-serif text-xl font-medium mb-1">{treatment.name}</h3>
            <p className="text-muted-foreground text-sm">{treatment.description}</p>
            
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mt-3">
              {badges.map((badge, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="gap-1.5 px-3 py-1 font-normal"
                >
                  <badge.icon className="w-3 h-3" />
                  {badge.text}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Price section */}
        <div className="bg-secondary/40 rounded-xl p-4 mb-6">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Valor mensal</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-serif font-medium text-foreground">
                  R$ {treatment.price.toFixed(2).replace('.', ',')}
                </span>
                <span className="text-sm text-muted-foreground">/ mês</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground line-through">
                R$ {treatment.originalPrice.toFixed(2).replace('.', ',')}
              </p>
              <Badge className="bg-coral text-foreground hover:bg-coral mt-1">
                -{discount}% OFF
              </Badge>
            </div>
          </div>
        </div>

        {/* Features list */}
        <div className="border-t border-border/60 pt-6">
          <p className="font-semibold mb-4 text-sm uppercase tracking-wide text-muted-foreground">
            Seu plano mensal inclui
          </p>
          <ul className="space-y-3">
            {treatment.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-teal/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-teal" />
                </div>
                <span className="text-foreground">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Price breakdown */}
        <div className="mt-8 pt-6 border-t border-border/60 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>R$ {treatment.originalPrice.toFixed(2).replace('.', ',')}/mês</span>
          </div>
          <div className="flex justify-between text-teal font-medium">
            <span>{discount}% desconto no primeiro pedido</span>
            <span>- R$ {(treatment.originalPrice - treatment.price).toFixed(2).replace('.', ',')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Frete</span>
            <span className="text-teal font-medium">Grátis</span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-3 border-t border-border/60">
            <span>Total</span>
            <span>R$ {treatment.price.toFixed(2).replace('.', ',')} / mês</span>
          </div>
        </div>

        {/* CTA Button */}
        <Button 
          variant="coral" 
          className="w-full mt-8" 
          size="lg" 
          onClick={onSelect}
        >
          Iniciar tratamento
        </Button>

        {/* Trust badges */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          Cancele quando quiser • Entrega grátis • Suporte 24h
        </p>
      </div>
    </Card>
  );
}
