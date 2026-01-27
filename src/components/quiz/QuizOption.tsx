import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

interface QuizOptionProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  multiSelect?: boolean;
  index?: number;
}

export function QuizOption({ label, selected, onClick, multiSelect = false, index = 0 }: QuizOptionProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25,
        delay: index * 0.08,
      }}
      whileHover={{ 
        y: -2,
        transition: { type: "spring", stiffness: 400, damping: 20 }
      }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "w-full p-4 text-left rounded-xl border-2 overflow-visible",
        "flex items-center justify-between gap-3",
        "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2",
        "transition-colors duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
        selected 
          ? "border-primary bg-primary/10 text-foreground" 
          : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-primary/5"
      )}
    >
      <span className="font-medium leading-snug">{label}</span>
      <motion.div 
        className={cn(
          "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0",
          multiSelect && "rounded-md",
          selected 
            ? "border-primary bg-primary text-primary-foreground" 
            : "border-muted-foreground/30"
        )}
        animate={{
          scale: selected ? 1 : 0.9,
          backgroundColor: selected ? "hsl(var(--primary))" : "transparent",
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 20,
        }}
      >
        <motion.div
          initial={false}
          animate={{
            scale: selected ? 1 : 0,
            opacity: selected ? 1 : 0,
          }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 25,
          }}
        >
          <Check className="w-4 h-4" />
        </motion.div>
      </motion.div>
    </motion.button>
  );
}
