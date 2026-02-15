import { useRef, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollHint, setShowScrollHint] = useState(true);

  // IntersectionObserver for scroll sentinel
  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onScrollComplete();
          setShowScrollHint(false);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
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
          <ScrollArea className="h-full max-h-[50vh]" ref={scrollContainerRef}>
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

              {/* Link to full terms */}
              <a
                href={CONSENT_CONFIG.TERMS_ROUTE}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-[#1B5E8C] hover:underline font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                {t.termsLink}
              </a>

              {/* Sentinel for scroll detection */}
              <div ref={sentinelRef} className="h-1" aria-hidden="true" />
            </div>
          </ScrollArea>

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

        {/* Checkboxes + Footer */}
        <div className="px-6 pb-6 pt-4 border-t border-border/40 flex-shrink-0 space-y-4">
          {/* Checkboxes */}
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer group">
              <Checkbox
                id="terms-checkbox"
                checked={termsCheckbox}
                onCheckedChange={(v) => onTermsChange(v === true)}
                aria-required="true"
                className="mt-0.5 border-[#1B5E8C] data-[state=checked]:bg-[#1B5E8C] data-[state=checked]:border-[#1B5E8C]"
              />
              <span className="text-sm text-gray-700 leading-snug group-hover:text-gray-900 transition-colors">
                {t.checkbox1}
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer group">
              <Checkbox
                id="age-checkbox"
                checked={ageCheckbox}
                onCheckedChange={(v) => onAgeChange(v === true)}
                aria-required="true"
                className="mt-0.5 border-[#1B5E8C] data-[state=checked]:bg-[#1B5E8C] data-[state=checked]:border-[#1B5E8C]"
              />
              <span className="text-sm text-gray-700 leading-snug group-hover:text-gray-900 transition-colors">
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
          <div className="flex flex-col gap-2">
            <Button
              onClick={onAccept}
              disabled={!canAccept || isLoading}
              className="bg-[#1B5E8C] hover:bg-[#154A6E] text-white font-medium py-3 px-8 rounded-xl transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed h-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Registrando...
                </>
              ) : (
                t.acceptButton
              )}
            </Button>
            <a
              href={CONSENT_CONFIG.SUPPORT_WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className="text-center text-sm text-gray-500 hover:text-[#1B5E8C] transition-colors py-1"
            >
              {t.supportLink}
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
