import { TreatmentRecommendation } from "@/types/assessment";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Syringe, Pill, Leaf } from "lucide-react";

interface TreatmentCardProps {
  treatment: TreatmentRecommendation;
  onSelect: () => void;
}

const treatmentIcons = {
  injectable: Syringe,
  oral: Pill,
  lifestyle: Leaf,
};

export function TreatmentCard({ treatment, onSelect }: TreatmentCardProps) {
  const Icon = treatmentIcons[treatment.type];
  const discount = Math.round((1 - treatment.price / treatment.originalPrice) * 100);

  return (
    <Card className="overflow-hidden card-elevated">
      <div className="bg-primary text-primary-foreground text-center py-2 text-sm font-semibold">
        Recomendado
      </div>
      
      <div className="p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="icon-container">
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{treatment.name}</h3>
            <p className="text-sm text-muted-foreground">{treatment.description}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-foreground">
              R$ {treatment.price.toFixed(2).replace('.', ',')} <span className="text-sm font-normal">/ Mês</span>
            </p>
            <p className="text-sm text-muted-foreground line-through">
              R$ {treatment.originalPrice.toFixed(2).replace('.', ',')} / Mês
            </p>
          </div>
        </div>

        <div className="border-t pt-4">
          <p className="font-semibold mb-3">Seu plano mensal inclui:</p>
          <ul className="space-y-2">
            {treatment.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 pt-4 border-t space-y-3">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>R$ {treatment.originalPrice.toFixed(2).replace('.', ',')}/mês</span>
          </div>
          <div className="flex justify-between text-sm text-primary font-medium">
            <span>{discount}% desconto no primeiro pedido</span>
            <span>- R$ {(treatment.originalPrice - treatment.price).toFixed(2).replace('.', ',')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Frete</span>
            <span className="text-primary">Grátis</span>
          </div>
          <div className="flex justify-between font-bold pt-2 border-t">
            <span>Total</span>
            <span>R$ {treatment.price.toFixed(2).replace('.', ',')} / mês</span>
          </div>
        </div>

        <Button variant="coral" className="w-full mt-6" size="lg" onClick={onSelect}>
          Iniciar tratamento
        </Button>
      </div>
    </Card>
  );
}
