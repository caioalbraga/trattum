import { motion } from "framer-motion";
import { ReactNode } from "react";

interface FadeInContentProps {
  children: ReactNode;
  className?: string;
}

export function FadeInContent({ children, className }: FadeInContentProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1]
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
