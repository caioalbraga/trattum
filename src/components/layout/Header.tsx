import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import { useState } from "react";

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();

  // Track scroll position to toggle header style
  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50);
  });

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
    <motion.header
      initial={false}
      animate={{
        backgroundColor: isScrolled 
          ? "hsl(var(--background) / 0.85)" 
          : "hsl(var(--background))",
        backdropFilter: isScrolled ? "blur(12px)" : "blur(0px)",
        borderBottomColor: isScrolled 
          ? "hsl(var(--border) / 0.4)" 
          : "hsl(var(--border) / 0)",
      }}
      transition={{
        type: "spring",
        stiffness: 100,
        damping: 20,
      }}
      className="sticky top-0 z-50 border-b"
    >
      <div className="container flex h-16 items-center justify-between">
        {/* Logo - Left */}
        <Link to="/" className="flex items-center">
          <motion.h1 
            className="text-xl font-semibold text-foreground tracking-wide"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            TRATTUM
          </motion.h1>
        </Link>
        
        {/* Right Navigation */}
        <nav className="hidden md:flex items-center gap-4">
          <motion.button 
            onClick={scrollToAbout}
            className="text-sm font-medium text-foreground hover:text-primary uppercase tracking-wide"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            Quem Somos
          </motion.button>
          <ThemeToggle />
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Button 
              variant="ghost" 
              className="text-sm font-medium uppercase tracking-wide"
              onClick={() => navigate('/auth')}
            >
              Entrar
            </Button>
          </motion.div>
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
    </motion.header>
  );
}
