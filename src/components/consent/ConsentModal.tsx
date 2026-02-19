import { useRef, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CONSENT_TEXTS } from "@/lib/consent.texts";
import { CONSENT_CONFIG } from "@/lib/consent.config";
import {
  ShieldCheck,
  ClipboardList,
  Heart,
  Shield,
  Lock,
  UserCheck,
  ChevronDown,
  Loader2,
  ExternalLink,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ConsentModalProps {
  open: boolean;
  scrollCompleted: boolean;
  termsCheckbox: boolean;
  ageCheckbox: boolean;
  canAccept: boolean;
  isLoading: boolean;
  error: string | null;
  onScrollComplete: () => void;
  onTermsChange: (v: boolean) => void;
  onAgeChange: (v: boolean) => void;
  onAccept: () => void;
}

const t = CONSENT_TEXTS.modal;

const iconMap: Record<string, typeof ClipboardList> = {
  clipboard: ClipboardList,
  heart: Heart,
  shield: Shield,
};

export function ConsentModal({
  open,
  scrollCompleted,
  termsCheckbox,
  ageCheckbox,
  canAccept,
  isLoading,
  error,
  onScrollComplete,
  onTermsChange,
  onAgeChange,
  onAccept,
}: ConsentModalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const check = () => {
      const isBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 10;
      if (isBottom) {
        setAtBottom(true);
        onScrollComplete();
      }
    };

    check();
    el.addEventListener("scroll", check, { passive: true });
    return () => el.removeEventListener("scroll", check);
  }, [onScrollComplete]);

  return (
    <Dialog open={open} onOpenChange={() => {}} modal>
      <DialogContent
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-[calc(100%-2rem)] p-0 gap-0 overflow-hidden [&>button]:hidden border-0"
        style={{ maxHeight: "min(92vh, 720px)", display: "flex", flexDirection: "column" }}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        aria-labelledby="consent-title"
        aria-describedby="consent-desc"
      >
        {/* ─── HEADER ─── */}
        <header className="shrink-0 px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="size-5 text-primary" />
            </div>
            <div className="min-w-0">
              <DialogTitle id="consent-title" className="text-base font-bold text-foreground leading-tight">
                {t.title}
              </DialogTitle>
              <DialogDescription id="consent-desc" className="text-xs text-muted-foreground mt-0.5">
                {t.subtitle}
              </DialogDescription>
            </div>
          </div>
        </header>

        {/* ─── SCROLLABLE TERMS ─── */}
        <div className="relative flex-1 min-h-0">
          <div ref={scrollRef} className="h-full overflow-y-auto overscroll-contain">
            <div className="px-6 py-5 space-y-6">
              {/* Section 1 — Data Usage */}
              <section>
                <h3 className="text-[11px] font-bold text-muted-foreground mb-2 uppercase tracking-widest">
                  {t.section1Title}
                </h3>
                <p className="text-[13px] leading-relaxed text-muted-foreground mb-3">
                  {t.section1Body}
                </p>
                <ul className="space-y-1.5 mb-3">
                  {t.section1Items.map((item, i) => {
                    const Icon = iconMap[item.icon] || Shield;
                    return (
                      <li key={i} className="flex items-start gap-2.5 py-2 px-3 rounded-lg bg-muted/50">
                        <Icon className="size-4 text-primary mt-0.5 shrink-0" />
                        <span className="text-[13px] text-foreground/70">{item.text}</span>
                      </li>
                    );
                  })}
                </ul>
                <div className="bg-primary/5 rounded-lg px-3.5 py-2.5">
                  <p className="text-[13px] font-semibold text-primary">{t.section1Highlight}</p>
                </div>
              </section>

              {/* Section 2 — Protection */}
              <section>
                <h3 className="text-[11px] font-bold text-muted-foreground mb-2 uppercase tracking-widest">
                  {t.section2Title}
                </h3>
                <ul className="space-y-2">
                  {t.section2Items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Lock className="size-3.5 text-muted-foreground/60 mt-0.5 shrink-0" />
                      <span className="text-[13px] text-foreground/70">{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Section 3 — Rights */}
              <section>
                <h3 className="text-[11px] font-bold text-muted-foreground mb-2 uppercase tracking-widest">
                  {t.section3Title}
                </h3>
                <ul className="space-y-2">
                  {t.section3Items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <UserCheck className="size-3.5 text-muted-foreground/60 mt-0.5 shrink-0" />
                      <span className="text-[13px] text-foreground/70">{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Bottom breathing room */}
              <div className="h-4" aria-hidden />
            </div>
          </div>

          {/* Scroll-down indicator */}
          <AnimatePresence>
            {!atBottom && !scrollCompleted && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none flex items-end justify-center pb-2"
              >
                <motion.div
                  animate={{ y: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
                  className="flex flex-col items-center gap-0.5"
                >
                  <ChevronDown className="size-4 text-muted-foreground/50" />
                  <span className="text-[10px] text-muted-foreground/50 font-medium">{t.scrollHint}</span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ─── FOOTER — ACCEPTANCE AREA ─── */}
        <footer className="shrink-0 border-t border-gray-100 bg-muted/30">
          <div className="px-6 py-5 space-y-4">
            {/* Terms link */}
            <div className="flex justify-center">
              <a
                href={CONSENT_CONFIG.TERMS_ROUTE}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] text-primary/60 hover:text-primary hover:underline font-medium transition-colors"
              >
                <ExternalLink className="size-3" />
                {t.termsLink}
              </a>
            </div>

            {/* Checkboxes */}
            <div className="space-y-2.5">
              <CheckboxCard
                id="cb-terms"
                checked={termsCheckbox}
                onChange={onTermsChange}
                label={t.checkbox1}
              />
              <CheckboxCard
                id="cb-age"
                checked={ageCheckbox}
                onChange={onAgeChange}
                label={t.checkbox2}
              />
            </div>

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-[13px] text-destructive bg-destructive/5 border border-destructive/10 rounded-lg px-3 py-2 overflow-hidden"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Accept button */}
            <button
              type="button"
              onClick={onAccept}
              disabled={!canAccept || isLoading}
              className={`
                w-full h-12 rounded-xl font-semibold text-sm transition-all duration-200
                flex items-center justify-center gap-2
                ${canAccept && !isLoading
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
                t.acceptButton
              )}
            </button>

            {/* Support */}
            <p className="text-center">
              <a
                href={CONSENT_CONFIG.SUPPORT_WHATSAPP}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
              >
                {t.supportLink}
              </a>
            </p>
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Checkbox Card ─── */
function CheckboxCard({
  id,
  checked,
  onChange,
  label,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label
      htmlFor={id}
      className={`
        flex items-start gap-3 cursor-pointer rounded-xl border-2 p-3.5 transition-all duration-200 select-none
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
              ? "bg-primary border-primary scale-100"
              : "border-muted-foreground/30 bg-background scale-100"
            }
          `}
        >
          <AnimatePresence>
            {checked && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
              >
                <Check className="size-3 text-primary-foreground" strokeWidth={3} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <span className="text-[13px] leading-relaxed text-foreground/80">{label}</span>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
    </label>
  );
}
