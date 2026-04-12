import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { FileText, ChevronRight } from "lucide-react";

const terms = [
  {
    slug: "termos-de-uso",
    title: "Termos de Uso",
    description: "Regras gerais de uso da plataforma Trattum, responsabilidades do usuário e da empresa.",
  },
  {
    slug: "politica-de-privacidade",
    title: "Política de Privacidade",
    description: "Como coletamos, utilizamos, armazenamos e protegemos seus dados pessoais conforme a LGPD.",
  },
  {
    slug: "tcle",
    title: "Termo de Consentimento Livre e Esclarecido (TCLE)",
    description: "Consentimento informado para coleta e tratamento de dados sensíveis de saúde.",
  },
  {
    slug: "declaracao-de-veracidade",
    title: "Declaração de Veracidade da Anamnese",
    description: "Declaração de que as informações fornecidas na anamnese são verídicas e atualizadas.",
  },
  {
    slug: "termo-de-responsabilidade-medicacao",
    title: "Termo de Responsabilidade pelo Uso da Medicação",
    description: "Responsabilidades do paciente quanto ao uso correto da medicação prescrita.",
  },
];

export default function TermsIndex() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8 max-w-3xl mx-auto">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground font-medium">Documentos e Termos</span>
        </nav>

        <div className="text-center mb-10">
          <FileText className="w-8 h-8 text-primary mx-auto mb-4" />
          <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Documentos e Termos</h1>
          <p className="text-muted-foreground">Consulte todos os termos e políticas da Trattum.</p>
        </div>

        <div className="space-y-4">
          {terms.map((t) => (
            <Link
              key={t.slug}
              to={`/termos/${t.slug}`}
              className="block rounded-xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                    {t.title}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">{t.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 ml-4" />
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
