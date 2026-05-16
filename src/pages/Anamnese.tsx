import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/layout/Header";
import { AnamneseForm } from "@/components/anamnese/AnamneseForm";
import { supabase } from "@/integrations/supabase/client";

export default function Anamnese() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (!cancelled) setChecking(false);
        return;
      }
      const { data, error } = await supabase
        .from("avaliacoes")
        .select("id")
        .eq("user_id", session.user.id)
        .limit(1)
        .maybeSingle();

      if (cancelled) return;

      if (!error && data) {
        toast.info("Sua avaliação já foi enviada.");
        navigate("/dashboard", { replace: true });
        return;
      }
      setChecking(false);
    })();
    return () => { cancelled = true; };
  }, [navigate]);

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8 pb-24">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Anamnese Clínica
          </h1>
          <p className="text-muted-foreground">
            Responda algumas perguntas para personalizarmos seu tratamento
          </p>
        </div>

        <AnamneseForm />
      </main>
    </div>
  );
}
