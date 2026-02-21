import { ChevronRight, Facebook, Instagram, Mail } from "lucide-react";

const companyLinks = [
  { label: "Início", href: "/" },
  { label: "Quem Somos", href: "#" },
  { label: "Blog Clínico", href: "#" },
];

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      {/* Main Footer */}
      <div className="container py-16">
        <div className="mb-12">
          {/* Company Links */}
          <div className="max-w-xs">
            <h3 className="font-semibold text-sm mb-6 uppercase tracking-wide text-primary-foreground/70">
              Trattum
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
              Trattum
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
            <p className="text-primary-foreground/70">parcerias@trattum.com</p>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-primary-foreground/50 mt-8 max-w-2xl">
          A Trattum é uma plataforma de telemedicina. Todos os medicamentos são manipulados por farmácias credenciadas e autorizadas pela Anvisa, seguindo os mais rigorosos padrões de qualidade farmacêutica.
        </p>

        {/* Copyright & Payment Methods */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mt-8 pt-8 border-t border-primary-foreground/10">
          <p className="text-sm text-primary-foreground/50">
            © 2026 Trattum™. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
