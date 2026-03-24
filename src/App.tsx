import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index";
import Anamnese from "./pages/Anamnese";
import Auth from "./pages/Auth";
import Results from "./pages/Results";
import Cadastro from "./pages/Cadastro";
import Confirmacao from "./pages/Confirmacao";
import Checkout from "./pages/Checkout";
import NotEligible from "./pages/NotEligible";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import TermsPage from "./pages/TermsPage";
import Dashboard from "./pages/Dashboard";
import DashboardAtendimento from "./pages/DashboardAtendimento";
import DashboardTratamento from "./pages/DashboardTratamento";
import DashboardConta from "./pages/DashboardConta";
import DashboardNotificacoes from "./pages/DashboardNotificacoes";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAtendimento from "./pages/admin/AdminAtendimento";
import AdminAcompanhamento from "./pages/admin/AdminAcompanhamento";
import AdminConfiguracoes from "./pages/admin/AdminConfiguracoes";
import AdminUsuarios from "./pages/admin/AdminUsuarios";
import TestLogic from "./pages/TestLogic";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/anamnese" element={<Anamnese />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            <Route path="/results" element={<Results />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/confirmacao" element={<Confirmacao />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/termos" element={<TermsPage />} />
            <Route path="/not-eligible" element={<NotEligible />} />
            {/* Dashboard Routes */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/atendimento" element={<DashboardAtendimento />} />
            <Route path="/dashboard/tratamento" element={<DashboardTratamento />} />
            <Route path="/dashboard/conta" element={<DashboardConta />} />
            <Route path="/dashboard/notificacoes" element={<DashboardNotificacoes />} />
            {/* Admin Routes */}
            <Route path="/trattum-admin" element={<AdminDashboard />} />
            <Route path="/trattum-admin/atendimento" element={<AdminAtendimento />} />
            <Route path="/trattum-admin/acompanhamento" element={<AdminAcompanhamento />} />
            <Route path="/trattum-admin/configuracoes" element={<AdminConfiguracoes />} />
            <Route path="/trattum-admin/usuarios" element={<AdminUsuarios />} />
            {/* Developer Tools */}
            <Route path="/test-logic" element={<TestLogic />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
