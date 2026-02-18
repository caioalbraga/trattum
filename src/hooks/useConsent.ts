import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CONSENT_CONFIG } from "@/lib/consent.config";
import { CONSENT_TEXTS } from "@/lib/consent.texts";
import { toast } from "sonner";

interface UseConsentReturn {
  showModal: boolean;
  isLoading: boolean;
  isChecking: boolean;
  error: string | null;
  scrollCompleted: boolean;
  termsCheckbox: boolean;
  ageCheckbox: boolean;
  hasValidConsent: boolean;
  setTermsCheckbox: (v: boolean) => void;
  setAgeCheckbox: (v: boolean) => void;
  onScrollComplete: () => void;
  acceptConsent: () => Promise<void>;
  canAccept: boolean;
}

async function generateHash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function fetchIP(): Promise<string> {
  try {
    const res = await fetch(CONSENT_CONFIG.IP_API_URL);
    const data = await res.json();
    return data.ip || "unknown";
  } catch {
    return "unknown";
  }
}

export function useConsent() {
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scrollCompleted, setScrollCompleted] = useState(false);
  const [termsCheckbox, setTermsCheckbox] = useState(false);
  const [ageCheckbox, setAgeCheckbox] = useState(false);
  const [hasValidConsent, setHasValidConsent] = useState(false);

  const canAccept = termsCheckbox && ageCheckbox;

  // Check if user already has valid consent
  useEffect(() => {
    const checkConsent = async () => {
      setIsChecking(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          // Guest users — show modal, they'll need to consent
          setShowModal(true);
          setIsChecking(false);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("has_accepted_terms, terms_version_accepted")
          .eq("user_id", user.id)
          .maybeSingle();

        if (
          profile?.has_accepted_terms &&
          profile?.terms_version_accepted === CONSENT_CONFIG.CURRENT_VERSION
        ) {
          setHasValidConsent(true);
          setShowModal(false);
        } else {
          setShowModal(true);
        }
      } catch {
        setShowModal(true);
      } finally {
        setIsChecking(false);
      }
    };

    checkConsent();
  }, []);

  const onScrollComplete = useCallback(() => {
    setScrollCompleted(true);
  }, []);

  const acceptConsent = useCallback(async () => {
    if (!canAccept) return;
    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // For guest users, store consent in session and proceed
        sessionStorage.setItem("pendingConsent", "true");
        sessionStorage.setItem("pendingConsentVersion", CONSENT_CONFIG.CURRENT_VERSION);
        setHasValidConsent(true);
        setShowModal(false);
        setIsLoading(false);
        return;
      }

      // Generate document hash from terms content
      const termsText = CONSENT_TEXTS.terms.sections
        .map((s) => `${s.number}. ${s.title}\n${s.content}`)
        .join("\n\n");
      const [ip, documentHash] = await Promise.all([
        fetchIP(),
        generateHash(termsText),
      ]);

      const consentTimestamp = new Date().toISOString();

      // Check idempotency — already accepted this version?
      const { data: existing } = await supabase
        .from("consent_logs")
        .select("id")
        .eq("user_id", user.id)
        .eq("terms_version", CONSENT_CONFIG.CURRENT_VERSION)
        .is("revoked_at", null)
        .maybeSingle();

      if (existing) {
        // Already consented, just update profile and proceed
        await supabase
          .from("profiles")
          .update({
            has_accepted_terms: true,
            terms_version_accepted: CONSENT_CONFIG.CURRENT_VERSION,
            terms_accepted_at: consentTimestamp,
          })
          .eq("user_id", user.id);

        setHasValidConsent(true);
        setShowModal(false);
        setIsLoading(false);
        return;
      }

      // Insert consent log
      const { error: insertError } = await supabase
        .from("consent_logs")
        .insert({
          user_id: user.id,
          consent_timestamp: consentTimestamp,
          ip_address: ip,
          terms_version: CONSENT_CONFIG.CURRENT_VERSION,
          document_hash: documentHash,
          user_agent: navigator.userAgent,
          checkboxes_accepted: {
            terms_accepted: true,
            age_verification: true,
          },
          scroll_completed: true,
        });

      if (insertError) {
        throw new Error("Falha ao registrar consentimento. Tente novamente.");
      }

      // Update profile
      await supabase
        .from("profiles")
        .update({
          has_accepted_terms: true,
          terms_version_accepted: CONSENT_CONFIG.CURRENT_VERSION,
          terms_accepted_at: consentTimestamp,
        })
        .eq("user_id", user.id);

      // Send confirmation email (non-blocking)
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("nome")
          .eq("user_id", user.id)
          .maybeSingle();

        await supabase.functions.invoke("send-consent-email", {
          body: {
            user_id: user.id,
            user_name: profile?.nome || user.email,
            user_email: user.email,
            consent_timestamp: consentTimestamp,
            ip_address: ip,
            terms_version: CONSENT_CONFIG.CURRENT_VERSION,
            document_hash: documentHash,
          },
        });
      } catch {
        toast.info(
          "Seu aceite foi registrado. O e-mail de confirmação pode demorar alguns minutos."
        );
      }

      setHasValidConsent(true);
      setShowModal(false);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erro ao registrar consentimento. Tente novamente.";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [canAccept]);

  return {
    showModal,
    isLoading,
    isChecking,
    error,
    scrollCompleted,
    termsCheckbox,
    ageCheckbox,
    hasValidConsent,
    setTermsCheckbox,
    setAgeCheckbox,
    onScrollComplete,
    acceptConsent,
    canAccept,
  } satisfies UseConsentReturn;
}
