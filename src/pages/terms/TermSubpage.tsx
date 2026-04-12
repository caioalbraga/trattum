import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { CONSENT_TEXTS } from "@/lib/consent.texts";

const termContent: Record<string, { title: string; sections?: typeof CONSENT_TEXTS.terms.sections }> = {
  "termos-de-uso": {
    title: "Termos de Uso",
    sections: CONSENT_TEXTS.terms.sections.filter(s =>
      ["objeto", "responsabilidade", "reembolso", "foro"].includes(s.id)
    ),
  },
  "politica-de-privacidade": {
    title: "Política de Privacidade",
    sections: CONSENT_TEXTS.terms.sections.filter(s =>
      ["dados-coletados", "finalidade", "base-legal", "compartilhamento", "armazenamento", "direitos", "revogacao", "auditoria", "dpo"].includes(s.id)
    ),
  },
  "tcle": {
    title: "Termo de Consentimento Livre e Esclarecido (TCLE)",
    sections: CONSENT_TEXTS.terms.sections.filter(s =>
      ["objeto", "dados-coletados", "finalidade", "base-legal", "armazenamento", "direitos", "revogacao", "aviso-clinico"].includes(s.id)
    ),
  },
  "declaracao-de-veracidade": {
    title: "Declaração de Veracidade da Anamnese",
  },
  "termo-de-responsabilidade-medicacao": {
    title: "Termo de Responsabilidade pelo Uso da Medicação",
  },
};

const placeholderContent: Record<string, string> = {
  "declaracao-de-veracidade": `Eu, na qualidade de paciente e titular dos dados, declaro para os devidos fins que:\n\n1. Todas as informações fornecidas no formulário de anamnese clínica são verídicas, completas e atualizadas;\n\n2. Compreendo que a precisão das informações é essencial para a segurança e eficácia do tratamento proposto;\n\n3. Assumo total responsabilidade pela veracidade dos dados informados;\n\n4. Comprometo-me a informar imediatamente qualquer alteração relevante em meu quadro de saúde;\n\n5. Estou ciente de que informações falsas, incompletas ou desatualizadas podem comprometer a indicação de tratamento e isentam a Trattum de responsabilidade por eventuais consequências.\n\nEsta declaração é parte integrante do processo de avaliação clínica da Trattum.`,
  "termo-de-responsabilidade-medicacao": `Eu, na qualidade de paciente, declaro que:\n\n1. Recebi orientações claras sobre o uso correto da medicação prescrita, incluindo dosagem, frequência e via de administração;\n\n2. Fui informado(a) sobre os possíveis efeitos colaterais e contraindicações do tratamento;\n\n3. Comprometo-me a utilizar a medicação exclusivamente conforme as orientações médicas recebidas;\n\n4. Compreendo que NÃO devo alterar a dosagem ou interromper o tratamento sem prévia orientação médica;\n\n5. Comprometo-me a comunicar imediatamente qualquer reação adversa ou efeito colateral;\n\n6. Estou ciente de que a automedicação é proibida e pode trazer riscos à minha saúde;\n\n7. Declaro que a medicação será de uso exclusivamente pessoal e intransferível.\n\n⚠️ NÃO SE AUTOMEDIQUE. Em caso de emergência, ligue para o SAMU: 192.`,
};

function renderContent(content: string) {
  const html = content
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br />");
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function TermSubpage() {
  const { slug } = useParams<{ slug: string }>();
  const term = slug ? termContent[slug] : null;

  if (!term) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-12 text-center">
          <h1 className="text-2xl font-bold">Termo não encontrado</h1>
          <Link to="/termos" className="text-primary hover:underline mt-4 inline-block">
            ← Voltar para Termos
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8 max-w-3xl mx-auto">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/termos" className="hover:text-foreground transition-colors">Termos</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground font-medium">{term.title}</span>
        </nav>

        <Link to="/termos" className="inline-flex items-center gap-1 text-sm text-primary hover:underline mb-6">
          <ArrowLeft className="w-4 h-4" />
          Voltar para Termos
        </Link>

        <h1 className="font-serif text-2xl font-bold text-foreground mb-8">{term.title}</h1>

        <div className="prose prose-gray max-w-none">
          {term.sections ? (
            term.sections.map((s) => (
              <section key={s.id} className="mb-8">
                <h2 className="text-lg font-semibold text-foreground mb-3 flex items-baseline gap-2">
                  <span className="text-primary/60">{s.number}.</span>
                  {s.title}
                </h2>
                <div className="text-sm leading-relaxed text-muted-foreground">
                  {renderContent(s.content)}
                </div>
              </section>
            ))
          ) : (
            <div className="text-sm leading-relaxed text-muted-foreground">
              {slug && placeholderContent[slug]
                ? renderContent(placeholderContent[slug])
                : <p className="italic">[Conteúdo do {term.title} será inserido aqui]</p>
              }
            </div>
          )}
        </div>

        <div className="mt-12 pt-6 border-t border-border">
          <Link to="/termos" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
            <ArrowLeft className="w-4 h-4" />
            Voltar para Termos
          </Link>
        </div>
      </main>
    </div>
  );
}
