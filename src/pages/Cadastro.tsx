import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { useSubmitAssessment } from "@/hooks/useSubmitAssessment";
import { getPendingPhotos, clearPendingPhotos } from "@/lib/photo-store";

const emailSchema = z.string().email("E-mail inválido");
const passwordSchema = z.string().min(6, "Senha deve ter pelo menos 6 caracteres");

export default function Cadastro() {
  const navigate = useNavigate();
  const { submitAssessment, isSubmitting } = useSubmitAssessment();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);

  // Ensure pending answers exist, otherwise redirect back
  useEffect(() => {
    const pending = sessionStorage.getItem('pendingQuizAnswers');
    if (!pending) {
      navigate('/anamnese');
    }
  }, [navigate]);

  const uploadPhoto = async (file: File, userId: string, tipo: string): Promise<string | null> => {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${userId}/${tipo}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('anamnese-fotos').upload(path, file);
    if (error) {
      console.error(`Upload error (${tipo}):`, error);
      return null;
    }
    const { data } = supabase.storage.from('anamnese-fotos').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    setIsLoading(true);

    try {
      // Extract nome_completo from pending answers to use as full_name
      const pendingStr = sessionStorage.getItem('pendingQuizAnswers');
      const pendingAnswers = pendingStr ? JSON.parse(pendingStr) : {};
      const fullName = pendingAnswers.nome_completo || '';

      const { data: signUpData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          toast.error('Este e-mail já está cadastrado. Faça login na página de autenticação.');
        } else {
          toast.error(error.message);
        }
        return;
      }

      const userId = signUpData.user?.id;

      // Upload pending photos if user was created
      if (userId) {
        // Register consent accepts
        const now = new Date().toISOString();
        await supabase.from('user_consents').upsert([
          { user_id: userId, termo: 'termos_de_uso', aceito: true, aceito_em: now },
          { user_id: userId, termo: 'politica_de_privacidade', aceito: true, aceito_em: now },
        ], { onConflict: 'user_id,termo' });

        const photos = getPendingPhotos();
        const photoUrls: Record<string, string> = {};

        const uploadPromises: Promise<void>[] = [];
        for (const [tipo, file] of Object.entries(photos)) {
          if (file) {
            uploadPromises.push(
              uploadPhoto(file, userId, tipo).then(url => {
                if (url) photoUrls[`foto_${tipo}`] = url;
              })
            );
          }
        }
        await Promise.all(uploadPromises);

        // Add photo URLs to the pending answers
        if (Object.keys(photoUrls).length > 0 && pendingStr) {
          const updatedAnswers = { ...pendingAnswers, ...photoUrls };
          sessionStorage.setItem('pendingQuizAnswers', JSON.stringify(updatedAnswers));
        }

        clearPendingPhotos();
      }

      // Submit pending anamnese data now that user is authenticated
      const updatedPendingStr = sessionStorage.getItem('pendingQuizAnswers');
      if (updatedPendingStr) {
        const answers = JSON.parse(updatedPendingStr);
        await submitAssessment(answers);
      }

      // Navigate to confirmation
      navigate('/confirmacao');
    } catch (err) {
      toast.error('Erro ao criar conta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/40 bg-background/98 backdrop-blur-sm">
        <div className="container flex h-16 items-center">
          <Link to="/anamnese" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Voltar</span>
          </Link>
          <Link to="/" className="absolute left-1/2 -translate-x-1/2">
            <h1 className="font-serif text-xl font-semibold text-foreground tracking-wide">
              TRATTUM
            </h1>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="font-serif text-2xl">Crie sua conta</CardTitle>
            <CardDescription>
              Para enviar sua anamnese e acompanhar o tratamento, crie uma conta com e-mail e senha.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Mínimo de 6 caracteres</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="acceptTerms"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <label htmlFor="acceptTerms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                    Li e concordo com os{" "}
                    <a href="/termos/termos-de-uso" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      Termos de Uso
                    </a>
                  </label>
                </div>
                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="acceptPrivacy"
                    checked={acceptPrivacy}
                    onChange={(e) => setAcceptPrivacy(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <label htmlFor="acceptPrivacy" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                    Li e concordo com a{" "}
                    <a href="/termos/politica-de-privacidade" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      Política de Privacidade
                    </a>
                  </label>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading || isSubmitting || !acceptTerms || !acceptPrivacy}>
                {(isLoading || isSubmitting) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isLoading || isSubmitting ? "Criando conta..." : "Criar Conta"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Já tem uma conta?{" "}
              <Link to="/auth" className="text-primary hover:underline">
                Faça login
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
