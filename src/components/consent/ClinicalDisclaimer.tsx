import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CONSENT_TEXTS } from "@/lib/consent.texts";
import { CONSENT_CONFIG } from "@/lib/consent.config";

export function ClinicalDisclaimer() {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <AnimatePresence mode="wait">
        {expanded ? (
          <motion.div
            key="expanded"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-amber-50 border-t border-amber-200 px-4 py-3"
          >
            <div className="container max-w-4xl mx-auto flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed text-amber-900 flex-1">
                {CONSENT_TEXTS.disclaimer.full}
              </p>
              <button
                onClick={() => setExpanded(false)}
                className="text-xs font-medium text-amber-700 hover:text-amber-900 whitespace-nowrap shrink-0 bg-amber-100 px-2 py-1 rounded-md transition-colors"
              >
                {CONSENT_TEXTS.disclaimer.dismiss}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="compact"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => setExpanded(true)}
            className="absolute bottom-4 left-4 flex items-center gap-1.5 bg-amber-100 border border-amber-200 text-amber-800 text-xs font-medium px-3 py-2 rounded-full shadow-md hover:bg-amber-200 transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            {CONSENT_TEXTS.disclaimer.compact}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
