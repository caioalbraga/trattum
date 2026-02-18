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
  AlertTriangle,
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

function CustomCheckbox({
  checked,
  onChange,
  id,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
  label: string;
}) {
  return (
    <label
      htmlFor={id}
      className={`
        flex items-start gap-3.5 cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 select-none
        ${checked
          ? "border-[#1B5E8C] bg-[hsl(200_60%_35%/0.04)]"
          : "border-gray-200 bg-white hover:border-gray-300"
        }
      `}
    >
      <div className="pt-0.5 shrink-0">
        <div
          className={`
            w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200
            ${checked
              ? "bg-[#1B5E8C] border-[#1B5E8C]"
              : "border-gray-300 bg-white"
            }
          `}
        >
          {checked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
        </div>
      </div>
      <span className="text-[13px] leading-relaxed text-gray-700">
        {label}
      </span>
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollHint, setShowScrollHint] = useState(true);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollTop + clientHeight >= scrollHeight - 10) {
        onScrollComplete();
        setShowScrollHint(false);
      }
    };

    handleScroll();
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [onScrollComplete]);

  return (
    <Dialog open={open} onOpenChange={() => {}} modal>
      <DialogContent
        className="bg-white rounded-2xl shadow-2xl max-w-[580px] w-[calc(100%-2rem)] max-h-[92vh] flex flex-col p-0 gap-0 [&>button]:hidden border-0"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        aria-labelledby="consent-title"
        aria-describedby="consent-description"
      >
        {/* ── Header ── */}
        <div className="px-6 pt-6 pb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[hsl(200_60%_96%)] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#1B5E8C]" />
            </div>
            <div className="min-w-0">
              <DialogTitle
                id="consent-title"
                className="text-[17px] font-bold text-gray-900 leading-tight"
              >
                {t.title}
              </DialogTitle>
              <DialogDescription
                id="consent-description"
                className="text-[13px] text-gray-500 mt-0.5 leading-snug"
              >
                {t.subtitle}
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* ── Scrollable Terms Content ── */}
        <div className="relative flex-1 min-h-0 border-y border-gray-100">
          <div
            className="h-full max-h-[40vh] overflow-y-auto overscroll-contain"
            ref={scrollContainerRef}
          >
            <div className="px-6 py-5 space-y-5">
              {/* Data Usage */}
              <section>
                <h3 className="text-sm font-bold text-gray-900 mb-2.5 uppercase tracking-wide">
                  {t.section1Title}
                </h3>
                <p className="text-[13px] leading-relaxed text-gray-600 mb-3">
                  {t.section1Body}
                </p>
                <div className="space-y-1.5 mb-3">
                  {t.section1Items.map((item, i) => {
                    const Icon = iconMap[item.icon] || Shield;
                    return (
                      <div
                        key={i}
                        className="flex items-start gap-2.5 py-2 px-3 rounded-lg bg-gray-50"
                      >
                        <Icon className="w-4 h-4 text-[#1B5E8C] mt-0.5 shrink-0" />
                        <span className="text-[13px] text-gray-600">
                          {item.text}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="bg-[hsl(200_55%_96%)] rounded-lg px-3.5 py-2.5">
                  <p className="text-[13px] font-semibold text-[#1B5E8C]">
                    {t.section1Highlight}
                  </p>
                </div>
              </section>

              {/* Protection */}
              <section>
                <h3 className="text-sm font-bold text-gray-900 mb-2.5 uppercase tracking-wide">
                  {t.section2Title}
                </h3>
                <div className="space-y-1.5">
                  {t.section2Items.map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <Lock className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                      <span className="text-[13px] text-gray-600">{item}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Rights */}
              <section>
                <h3 className="text-sm font-bold text-gray-900 mb-2.5 uppercase tracking-wide">
                  {t.section3Title}
                </h3>
                <div className="space-y-1.5">
                  {t.section3Items.map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <UserCheck className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                      <span className="text-[13px] text-gray-600">{item}</span>
                    </div>
                  ))}
                </div>
              </section>

              <div className="h-2" />
            </div>
          </div>

          {/* Scroll hint */}
          <AnimatePresence>
            {showScrollHint && !scrollCompleted && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute bottom-0 left-0 right-0 flex flex-col items-center pb-2 pt-10 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none"
              >
                <motion.div
                  animate={{ y: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="flex flex-col items-center"
                >
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                  <span className="text-[11px] text-gray-400 font-medium mt-0.5">
                    {t.scrollHint}
                  </span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Footer: Acceptance Area ── */}
        <div className="px-6 pb-5 pt-5 flex-shrink-0 space-y-4 bg-gray-50/50">
          {/* Link to full terms */}
          <div className="flex justify-center">
            <a
              href={CONSENT_CONFIG.TERMS_ROUTE}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[12px] text-[#1B5E8C]/70 hover:text-[#1B5E8C] hover:underline font-medium transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              {t.termsLink}
            </a>
          </div>

          {/* Checkboxes */}
          <div className="space-y-2">
            <CustomCheckbox
              id="terms-cb"
              checked={termsCheckbox}
              onChange={onTermsChange}
              label={t.checkbox1}
            />
            <CustomCheckbox
              id="age-cb"
              checked={ageCheckbox}
              onChange={onAgeChange}
              label={t.checkbox2}
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-[13px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Accept Button */}
          <button
            type="button"
            onClick={onAccept}
            disabled={!canAccept || isLoading}
            className={`
              w-full py-3.5 px-6 rounded-xl font-semibold text-[15px] transition-all duration-200
              flex items-center justify-center gap-2
              ${canAccept && !isLoading
                ? "bg-[#1B5E8C] hover:bg-[#154A6E] text-white shadow-md hover:shadow-lg active:scale-[0.98]"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }
            `}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Registrando...
              </>
            ) : (
              t.acceptButton
            )}
          </button>

          {/* Support link */}
          <p className="text-center">
            <a
              href={CONSENT_CONFIG.SUPPORT_WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
            >
              {t.supportLink}
            </a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
