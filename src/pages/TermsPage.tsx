import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { CONSENT_TEXTS } from "@/lib/consent.texts";
import { CONSENT_CONFIG } from "@/lib/consent.config";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const sections = CONSENT_TEXTS.terms.sections;

export default function TermsPage() {
  const [activeSection, setActiveSection] = useState<string>(sections[0].id);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // Scroll spy
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );

    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) {
        sectionRefs.current[s.id] = el;
        observer.observe(el);
      }
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setSidebarOpen(false);
  };

  const renderContent = (content: string) => {
    // Convert markdown-like bold to HTML
    const html = content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br />");
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8 max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground font-medium">
            Termos e Condições
          </span>
        </nav>

        {/* Hero */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h1 className="heading-display mb-4">
            {CONSENT_TEXTS.terms.pageTitle}
          </h1>
          <p className="text-muted-foreground mb-3">
            Última atualização: {CONSENT_TEXTS.terms.lastUpdated}
          </p>
          <Badge variant="outline" className="text-xs tracking-widest uppercase">
            Versão {CONSENT_TEXTS.terms.version}
          </Badge>
        </div>

        <div className="flex gap-10">
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Índice
              </p>
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollToSection(s.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                    activeSection === s.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  {s.number}. {s.title}
                </button>
              ))}
            </div>
          </aside>

          {/* Mobile sidebar toggle */}
          <div className="lg:hidden fixed bottom-4 right-4 z-40">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="shadow-lg"
            >
              <FileText className="w-4 h-4 mr-1" />
              Índice
            </Button>
            {sidebarOpen && (
              <div className="absolute bottom-12 right-0 w-72 bg-card border border-border rounded-xl shadow-2xl p-4 max-h-[60vh] overflow-y-auto">
                {sections.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => scrollToSection(s.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                      activeSection === s.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {s.number}. {s.title}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="prose prose-gray max-w-none">
              {sections.map((s) => (
                <section
                  key={s.id}
                  id={s.id}
                  className="mb-10 scroll-mt-24"
                >
                  <h2 className="text-xl font-semibold text-foreground mb-4 flex items-baseline gap-2">
                    <span className="text-primary/60 text-lg">
                      {s.number}.
                    </span>
                    {s.title}
                  </h2>
                  <div className="text-sm leading-relaxed text-muted-foreground">
                    {renderContent(s.content)}
                  </div>
                  {s.id === "aviso-clinico" && (
                    <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <p className="text-sm font-bold text-red-700">
                        ⚠️ NÃO SE AUTOMEDIQUE. Em caso de emergência, ligue
                        para o SAMU: {CONSENT_CONFIG.SAMU_NUMBER}.
                      </p>
                    </div>
                  )}
                </section>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-border">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground text-center sm:text-left">
                  <p>Documento datado de {CONSENT_TEXTS.terms.lastUpdated}</p>
                  <p>Versão {CONSENT_TEXTS.terms.version}</p>
                </div>
                <Link to="/">
                  <Button variant="outline">
                    Voltar para a plataforma
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
