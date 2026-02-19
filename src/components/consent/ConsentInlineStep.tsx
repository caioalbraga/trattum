import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Loader2, ArrowRight } from "lucide-react";
import { CONSENT_CONFIG } from "@/lib/consent.config";

interface ConsentInlineStepProps {
  isLoading: boolean;
  error: string | null;
  onAccept: () => Promise<void>;
}

export function ConsentInlineStep({ isLoading, error, onAccept }: ConsentInlineStepProps) {
  const [checked, setChecked] = useState(false);

  const handleContinue = async () => {
    if (!checked || isLoading) return;
    await onAccept();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="max-w-xl mx-auto"
    >
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <ShieldCheck className="size-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground leading-tight">
              Consentimento e Privacidade
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Precisamos do seu consentimento antes de iniciar
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 space-y-5">
          {/* Consent checkbox */}
          <label
            htmlFor="consent-lgpd"
            className={`
              flex items-start gap-3 cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 select-none
              ${checked
                ? "border-primary bg-primary/[0.03] shadow-sm"
                : "border-border bg-background hover:border-primary/30"
              }
            `}
          >
            <div className="pt-px shrink-0">
              <div
                className={`
                  size-[18px] rounded-[5px] border-2 flex items-center justify-center transition-all duration-150
                  ${checked
                    ? "bg-primary border-primary"
                    : "border-muted-foreground/30 bg-background"
                  }
                `}
              >
                {checked && (
                  <motion.svg
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    className="size-3 text-primary-foreground"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </motion.svg>
                )}
              </div>
            </div>
            <span className="text-[13px] leading-relaxed text-foreground/80">
              Li e concordo com os{" "}
              <a
                href={CONSENT_CONFIG.TERMS_ROUTE}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-primary font-medium underline underline-offset-2 hover:text-primary/80 transition-colors"
              >
                Termos de Uso e Política de Privacidade
              </a>{" "}
              e autorizo o uso dos meus dados para fins de acompanhamento de saúde, conforme a LGPD.
            </span>
            <input
              id="consent-lgpd"
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="sr-only"
            />
          </label>

          {/* Error */}
          {error && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="text-[13px] text-destructive bg-destructive/5 border border-destructive/10 rounded-lg px-3 py-2"
            >
              {error}
            </motion.p>
          )}

          {/* Continue button */}
          <button
            type="button"
            onClick={handleContinue}
            disabled={!checked || isLoading}
            className={`
              w-full h-12 rounded-xl font-semibold text-sm transition-all duration-200
              flex items-center justify-center gap-2
              ${checked && !isLoading
                ? "bg-primary text-primary-foreground shadow-md hover:shadow-lg hover:brightness-110 active:scale-[0.98]"
                : "bg-muted text-muted-foreground cursor-not-allowed"
              }
            `}
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Registrando...</span>
              </>
            ) : (
              <>
                <span>Continuar</span>
                <ArrowRight className="size-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
