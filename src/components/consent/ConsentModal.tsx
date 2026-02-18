import { useRef, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollHint, setShowScrollHint] = useState(true);

  // Scroll event listener to detect when user reaches bottom
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

    // Check immediately in case content fits without scrolling
    handleScroll();

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [onScrollComplete]);

  return (
    <Dialog open={open} onOpenChange={() => {}} modal>
      <DialogContent
        className="bg-[hsl(43_43%_98%)] rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col p-0 gap-0 [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        aria-labelledby="consent-title"
        aria-describedby="consent-description"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border/40 flex-shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[hsl(200_60%_35%/0.1)] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-[#1B5E8C]" />
            </div>
            <div>
              <DialogTitle
                id="consent-title"
                className="text-lg font-semibold text-gray-900"
              >
                {t.title}
              </DialogTitle>
              <DialogDescription
                id="consent-description"
                className="text-sm text-gray-500 mt-0.5"
              >
                {t.subtitle}
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="relative flex-1 min-h-0">
        <div className="h-full max-h-[50vh] overflow-y-auto" ref={scrollContainerRef}>
            <div className="px-6 py-5 space-y-6">
              {/* Section 1: Data Usage */}
              <section>
                <h3 className="text-base font-semibold text-gray-900 mb-3">
                  {t.section1Title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-700 mb-3">
                  {t.section1Body}
                </p>
                <div className="space-y-2 mb-3">
                  {t.section1Items.map((item, i) => {
                    const Icon = iconMap[item.icon] || Shield;
                    return (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-2.5 rounded-lg bg-white border border-border/30"
                      >
                        <Icon className="w-4 h-4 text-[#1B5E8C] mt-0.5 shrink-0" />
                        <span className="text-sm text-gray-700">
                          {item.text}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="bg-[hsl(200_60%_35%/0.06)] border border-[hsl(200_60%_35%/0.15)] rounded-lg p-3">
                  <p className="text-sm font-medium text-[#1B5E8C]">
                    {t.section1Highlight}
                  </p>
                </div>
              </section>

              {/* Section 2: Protection */}
              <section>
                <h3 className="text-base font-semibold text-gray-900 mb-3">
                  {t.section2Title}
                </h3>
                <div className="space-y-2">
                  {t.section2Items.map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <Lock className="w-3.5 h-3.5 text-[#1B5E8C] mt-1 shrink-0" />
                      <span className="text-sm text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Section 3: Rights */}
              <section>
                <h3 className="text-base font-semibold text-gray-900 mb-3">
                  {t.section3Title}
                </h3>
                <div className="space-y-2">
                  {t.section3Items.map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <UserCheck className="w-3.5 h-3.5 text-[#1B5E8C] mt-1 shrink-0" />
                      <span className="text-sm text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Section 4: Clinical Warning */}
              <section className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-base font-semibold text-amber-900 mb-2">
                      {t.section4Title}
                    </h3>
                    <p className="text-sm text-amber-800 mb-2">
                      {t.section4Body}
                    </p>
                    <p className="text-sm font-bold text-red-700">
                      {t.section4Warning}
                    </p>
                  </div>
                </div>
              </section>

              {/* Bottom spacer so content doesn't hide behind scroll hint */}
              <div className="h-4" />
            </div>
          </div>

          {/* Scroll hint overlay */}
          <AnimatePresence>
            {showScrollHint && !scrollCompleted && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute bottom-0 left-0 right-0 flex flex-col items-center pb-3 pt-8 bg-gradient-to-t from-[hsl(43_43%_98%)] to-transparent pointer-events-none"
              >
                <motion.div
                  animate={{ y: [0, 6, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="flex flex-col items-center"
                >
                  <ChevronDown className="w-5 h-5 text-[#1B5E8C]" />
                  <span className="text-xs text-[#1B5E8C] font-medium mt-1">
                    {t.scrollHint}
                  </span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Fixed Footer: Link + Checkboxes + Button */}
        <div className="px-6 pb-6 pt-4 border-t-2 border-border/50 flex-shrink-0 space-y-4 bg-[hsl(43_43%_98%)]">
          {/* Link to full terms */}
          <a
            href={CONSENT_CONFIG.TERMS_ROUTE}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-xs text-[#1B5E8C] hover:underline font-medium py-1"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {t.termsLink}
          </a>

          {/* Checkboxes */}
          <div className="space-y-2.5">
            <label
              htmlFor="terms-cb"
              className="flex items-center gap-3 cursor-pointer p-3.5 rounded-xl border border-border/40 bg-white hover:border-[#1B5E8C]/30 hover:shadow-sm transition-all select-none"
            >
              <input
                id="terms-cb"
                type="checkbox"
                checked={termsCheckbox}
                onChange={(e) => onTermsChange(e.target.checked)}
                className="shrink-0 h-[18px] w-[18px] accent-[#1B5E8C] cursor-pointer rounded"
              />
              <span className="text-[13px] text-gray-700 leading-relaxed">
                {t.checkbox1}
              </span>
            </label>
            <label
              htmlFor="age-cb"
              className="flex items-center gap-3 cursor-pointer p-3.5 rounded-xl border border-border/40 bg-white hover:border-[#1B5E8C]/30 hover:shadow-sm transition-all select-none"
            >
              <input
                id="age-cb"
                type="checkbox"
                checked={ageCheckbox}
                onChange={(e) => onAgeChange(e.target.checked)}
                className="shrink-0 h-[18px] w-[18px] accent-[#1B5E8C] cursor-pointer rounded"
              />
              <span className="text-[13px] text-gray-700 leading-relaxed">
                {t.checkbox2}
              </span>
            </label>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-2.5">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={onAccept}
              disabled={!canAccept || isLoading}
              className="w-full bg-[#1B5E8C] hover:bg-[#154A6E] text-white font-semibold py-3.5 px-8 rounded-xl transition-all duration-200 disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-[15px] shadow-sm hover:shadow-md"
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
            <p className="text-center">
              <a
                href={CONSENT_CONFIG.SUPPORT_WHATSAPP}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-400 hover:text-[#1B5E8C] transition-colors"
              >
                {t.supportLink}
              </a>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
