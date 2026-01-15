import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // TODO: Implement login logic
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // TODO: Implement signup logic
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Simple Header */}
      <header className="border-b border-border/40 bg-background/98 backdrop-blur-sm">
        <div className="container flex h-16 items-center">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Voltar</span>
          </Link>
          <Link to="/" className="absolute left-1/2 -translate-x-1/2">
            <h1 className="text-xl font-semibold text-foreground tracking-wide">
              TRATTUM
            </h1>
          </Link>
        </div>
      </header>

      {/* Auth Form */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Bem-vindo à Trattum</CardTitle>
            <CardDescription>
              Acesse sua conta ou crie uma nova para começar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Criar Conta</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="mt-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-login">E-mail</Label>
                    <Input 
                      id="email-login" 
                      type="email" 
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-login">Senha</Label>
                    <Input 
                      id="password-login" 
                      type="password" 
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Entrando..." : "Entrar"}
                  </Button>
                  <p className="text-center text-sm text-muted-foreground">
                    <a href="#" className="hover:text-primary underline-offset-4 hover:underline">
                      Esqueceu sua senha?
                    </a>
                  </p>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="mt-6">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name-signup">Nome completo</Label>
                    <Input 
                      id="name-signup" 
                      type="text" 
                      placeholder="Seu nome"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-signup">E-mail</Label>
                    <Input 
                      id="email-signup" 
                      type="email" 
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-signup">Senha</Label>
                    <Input 
                      id="password-signup" 
                      type="password" 
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Criando conta..." : "Criar Conta"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
