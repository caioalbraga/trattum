import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToAbout = () => {
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const aboutSection = document.getElementById("about-section");
        aboutSection?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      const aboutSection = document.getElementById("about-section");
      aboutSection?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-background/98 backdrop-blur-sm border-b border-border/40 transition-colors duration-300">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo - Left */}
        <Link to="/" className="flex items-center">
          <h1 className="text-xl font-semibold text-foreground tracking-wide">
            TRATTUM
          </h1>
        </Link>
        
        {/* Right Navigation */}
        <nav className="hidden md:flex items-center gap-4">
          <button 
            onClick={scrollToAbout}
            className="text-sm font-medium text-foreground hover:text-primary transition-colors uppercase tracking-wide"
          >
            Quem Somos
          </button>
          <ThemeToggle />
          <Button 
            variant="ghost" 
            className="text-sm font-medium uppercase tracking-wide"
            onClick={() => navigate('/auth')}
          >
            Entrar
          </Button>
        </nav>

        {/* Mobile Navigation */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/auth')}
          >
            Entrar
          </Button>
        </div>
      </div>
    </header>
  );
}
