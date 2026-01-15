import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Header() {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-background/98 backdrop-blur-sm border-b border-border/40 transition-colors duration-300">
      <div className="container flex h-16 items-center justify-between">
        {/* Left Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <button className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary transition-colors uppercase tracking-wide">
            Tratamentos
            <ChevronDown className="w-4 h-4" />
          </button>
          <Link 
            to="#" 
            className="text-sm font-medium text-foreground hover:text-primary transition-colors uppercase tracking-wide"
          >
            Blog
          </Link>
        </nav>

        {/* Logo */}
        <Link to="/" className="absolute left-1/2 -translate-x-1/2">
          <h1 className="text-xl font-semibold text-foreground tracking-wide">
            TRATTUM
          </h1>
        </Link>
        
        {/* Right Navigation */}
        <nav className="hidden md:flex items-center gap-4">
          <Link 
            to="#" 
            className="text-sm font-medium text-foreground hover:text-primary transition-colors uppercase tracking-wide"
          >
            Quem Somos
          </Link>
          <ThemeToggle />
          <Button 
            variant="ghost" 
            className="text-sm font-medium uppercase tracking-wide"
            onClick={() => navigate('/anamnese')}
          >
            Entrar
          </Button>
        </nav>

        {/* Mobile Navigation */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <Link to="/">
            <h1 className="text-lg font-semibold text-foreground tracking-wide">
              TRATTUM
            </h1>
          </Link>
        </div>
      </div>
    </header>
  );
}
