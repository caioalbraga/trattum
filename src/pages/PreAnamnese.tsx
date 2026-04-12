import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function PreAnamnese() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [checkTcle, setCheckTcle] = useState(false);
  const [checkVeracidade, setCheckVeracidade] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setChecking(false);
      return;
    }

    const check = async () => {
      const { data } = await supabase
        .from('user_consents')
        .select('termo')
        .eq('user_id', user.id)
        .in('termo', ['tcle', 'declaracao_de_veracidade']);

      if (data && data.length >= 2) {
        navigate('/anamnese', { replace: true });
        return;
      }
      setChecking(false);
    };
    check();
  }, [user, authLoading, navigate]);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      if (user) {
        const now = new Date().toISOString();
        await supabase.from('user_consents').upsert([
          { user_id: user.id, termo: 'tcle', aceito: true, aceito_em: now },
          { user_id: user.id, termo: 'declaracao_de_veracidade', aceito: true, aceito_em: now },
        ], { onConflict: 'user_id,termo' });
      }
      navigate('/anamnese');
    } catch {
      // proceed anyway
      navigate('/anamnese');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-12 flex items-center justify-center">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
            </div>
            <CardTitle className="font-serif text-2xl">Antes de começar</CardTitle>
            <CardDescription>
              Precisamos do seu consentimento para prosseguir com sua avaliação clínica.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="tcle"
                  checked={checkTcle}
                  onChange={(e) => setCheckTcle(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="tcle" className="text-sm text-foreground leading-relaxed cursor-pointer">
                  Li e concordo com o{" "}
                  <a href="/termos/tcle" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                    Termo de Consentimento Livre e Esclarecido (TCLE)
                  </a>
                </label>
              </div>
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="veracidade"
                  checked={checkVeracidade}
                  onChange={(e) => setCheckVeracidade(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="veracidade" className="text-sm text-foreground leading-relaxed cursor-pointer">
                  Li e concordo com a{" "}
                  <a href="/termos/declaracao-de-veracidade" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                    Declaração de Veracidade da Anamnese
                  </a>
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={handleConfirm}
                disabled={!checkTcle || !checkVeracidade || isSubmitting}
                className="w-full"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Iniciar avaliação
              </Button>
              <Button variant="ghost" onClick={() => navigate(-1)} className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
