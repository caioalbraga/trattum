import { ClipboardList, Package, Users } from "lucide-react";

const steps = [
  {
    icon: ClipboardList,
    title: "Avaliação estruturada",
    description: "Responda a um questionário clínico detalhado na plataforma. Esta anamnese inicial permite avaliar a sua elegibilidade ao tratamento.",
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80",
  },
  {
    icon: Package,
    title: "Análise médica",
    description: "Um médico habilitado revisa cuidadosamente o seu histórico. Em caso de aprovação clínica, é elaborado um plano com prescrição.",
    image: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&q=80",
  },
  {
    icon: Users,
    title: "Acompanhamento contínuo",
    description: "O paciente mantém um canal direto via chat na plataforma. A equipe acompanha a evolução clínica durante todo o processo.",
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&q=80",
  },
];

export function ProcessSection() {
  return (
    <section className="py-24">
      <div className="container">
        <h2 className="heading-section text-foreground mb-16 max-w-2xl">
          Como o tratamento é conduzido na plataforma
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div 
              key={index}
              className="bg-muted/30 rounded-2xl p-6 flex flex-col"
            >
              {/* Title with underline effect */}
              <h3 className="text-lg font-semibold text-primary mb-3 relative inline-block">
                <span className="relative">
                  {step.title}
                  <svg
                    className="absolute -bottom-1 left-0 w-full"
                    height="6"
                    viewBox="0 0 100 6"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M0,5 Q25,0 50,3 T100,2"
                      fill="none"
                      stroke="hsl(var(--coral))"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h3>

              <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-1">
                {step.description}
              </p>

              {/* Image placeholder */}
              <div className="aspect-[4/3] bg-card rounded-xl overflow-hidden shadow-sm">
                <img 
                  src={step.image}
                  alt={step.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
