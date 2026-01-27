import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
}

export function LoadingSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <motion.div
      className={cn(
        "rounded-lg bg-muted",
        className
      )}
      animate={{
        opacity: [0.5, 0.8, 0.5],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

export function ResultsLoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        className="max-w-md w-full space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      >
        {/* Header skeleton */}
        <div className="text-center space-y-4">
          <motion.div
            className="w-20 h-20 mx-auto rounded-full bg-muted"
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="h-8 w-64 mx-auto rounded-lg bg-muted"
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
          />
          <motion.div
            className="h-4 w-48 mx-auto rounded bg-muted"
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
          />
        </div>

        {/* Chart skeleton */}
        <motion.div
          className="h-48 w-full rounded-2xl bg-muted"
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
        />

        {/* Treatment card skeleton */}
        <motion.div
          className="p-6 rounded-2xl bg-muted space-y-4"
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
        >
          <div className="h-6 w-40 rounded bg-background/50" />
          <div className="h-4 w-full rounded bg-background/50" />
          <div className="h-4 w-3/4 rounded bg-background/50" />
          <div className="h-12 w-full rounded-xl bg-background/50" />
        </motion.div>

        {/* Loading text */}
        <motion.p
          className="text-center text-muted-foreground text-sm"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          Analisando seu perfil de saúde...
        </motion.p>
      </motion.div>
    </div>
  );
}
