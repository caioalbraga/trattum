import { HelpCircle, ChevronRight, Facebook, Instagram, Mail } from "lucide-react";

const treatmentLinks = [
  { label: "Gerenciamento de Peso", href: "#" },
  { label: "Saúde Capilar", href: "#" },
  { label: "Saúde Sexual", href: "#" },
];

const companyLinks = [
  { label: "Início", href: "/" },
  { label: "Quem Somos", href: "#" },
  { label: "Central de Ajuda", href: "#" },
  { label: "Blog Clínico", href: "#" },
];

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      {/* Main Footer */}
      <div className="container py-16">
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          {/* Help Section */}
          <div>
            <h3 className="font-semibold text-lg mb-6 uppercase tracking-wide">
              Precisa de orientação?
            </h3>
            <a 
              href="#" 
              className="inline-flex items-center gap-3 text-primary-foreground/90 hover:text-primary-foreground transition-colors"
            >
              <div className="w-10 h-10 rounded-full border border-primary-foreground/30 flex items-center justify-center">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium">Acesse nossa Central de Ajuda</p>
                <p className="text-sm text-primary-foreground/60">Respostas para suas principais dúvidas</p>
              </div>
            </a>
          </div>

          {/* Treatment Links */}
          <div>
            <h3 className="font-semibold text-sm mb-6 uppercase tracking-wide text-primary-foreground/70">
              Programas Clínicos
            </h3>
            <ul className="space-y-4">
              {treatmentLinks.map((link, index) => (
                <li key={index}>
                  <a 
                    href={link.href}
                    className="flex items-center justify-between text-primary-foreground/90 hover:text-primary-foreground transition-colors group"
                  >
                    {link.label}
                    <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold text-sm mb-6 uppercase tracking-wide text-primary-foreground/70">
              VidaSaúde
            </h3>
            <ul className="space-y-4">
              {companyLinks.map((link, index) => (
                <li key={index}>
                  <a 
                    href={link.href}
                    className="flex items-center justify-between text-primary-foreground/90 hover:text-primary-foreground transition-colors group"
                  >
                    {link.label}
                    <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <hr className="border-primary-foreground/20 mb-12" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          {/* Logo */}
          <div>
            <h2 className="text-2xl font-serif font-semibold mb-6">
              VidaSaúde
            </h2>
            
            {/* Legal Links */}
            <div className="flex gap-6 text-sm text-primary-foreground/70">
              <a href="#" className="hover:text-primary-foreground transition-colors">
                Política de Privacidade
              </a>
              <a href="#" className="hover:text-primary-foreground transition-colors">
                Termos de Uso
              </a>
            </div>
          </div>

          {/* Social Links */}
          <div className="flex gap-4">
            <a 
              href="#"
              className="w-12 h-12 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors"
            >
              <Facebook className="w-5 h-5" />
            </a>
            <a 
              href="#"
              className="w-12 h-12 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors"
            >
              <Instagram className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Partner CTA */}
        <div className="mt-8 inline-flex items-center gap-3 bg-primary-foreground/10 rounded-xl px-4 py-3">
          <Mail className="w-5 h-5" />
          <div className="text-sm">
            <p className="font-medium">Seja uma farmácia parceira:</p>
            <p className="text-primary-foreground/70">parcerias@vidasaude.com.br</p>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-primary-foreground/50 mt-8 max-w-2xl">
          A VidaSaúde é uma plataforma de telemedicina. Todos os medicamentos são manipulados por farmácias credenciadas e autorizadas pela Anvisa, seguindo os mais rigorosos padrões de qualidade farmacêutica.
        </p>

        {/* Copyright & Payment Methods */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mt-8 pt-8 border-t border-primary-foreground/10">
          <p className="text-sm text-primary-foreground/50">
            © 2026 VidaSaúde™. Todos os direitos reservados.
          </p>

          <div className="flex items-center gap-4">
            {/* Payment Icons */}
            <div className="flex gap-2">
              <div className="w-10 h-6 bg-primary-foreground/20 rounded flex items-center justify-center text-[10px] font-medium">
                VISA
              </div>
              <div className="w-10 h-6 bg-primary-foreground/20 rounded flex items-center justify-center text-[10px] font-medium">
                MC
              </div>
              <div className="w-10 h-6 bg-primary-foreground/20 rounded flex items-center justify-center text-[10px] font-medium">
                PIX
              </div>
            </div>

            {/* Reclame Aqui Badge */}
            <div className="bg-card text-foreground rounded-lg px-3 py-2 flex items-center gap-2">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground text-xs">✓</span>
              </div>
              <div className="text-xs">
                <p className="font-bold">ÓTIMO</p>
                <p className="text-muted-foreground text-[10px]">ReclameAQUI</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
