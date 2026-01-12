import { Plus, User, Phone } from "lucide-react";

const steps = [
  {
    icon: Plus,
    title: 'Avaliação médica',
    description: 'O médico irá prescrever a medicação mais adequada para o seu caso, se necessário, em uma consulta não simultânea.',
  },
  {
    icon: User,
    title: 'Consultas com nutricionista',
    description: 'Nosso foco não é só passar uma dieta. Vamos cuidar de você como um todo, te ensinando a se alimentar sem restrições, e a ter autonomia para fazer boas escolhas.',
  },
  {
    icon: Phone,
    title: 'Time clínico',
    description: 'O time estará disponível diariamente pelo WhatsApp para esclarecer qualquer dúvida sobre o tratamento, medicações e outros temas.',
  },
];

export function HelpTimeline() {
  return (
    <div className="bg-card rounded-2xl p-6 shadow-card">
      <h3 className="text-2xl font-serif font-semibold mb-6">Como vamos te ajudar</h3>
      
      <div className="space-y-0">
        {steps.map((step, index) => (
          <div key={index} className="relative">
            <div className="flex gap-4">
              <div className="relative">
                <div className="icon-container">
                  <step.icon className="w-5 h-5" />
                </div>
                {index < steps.length - 1 && (
                  <div className="timeline-connector" />
                )}
              </div>
              <div className="pb-8">
                <h4 className="font-semibold text-foreground">{step.title}</h4>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
