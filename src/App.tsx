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
import Checkout from "./pages/Checkout";
import NotEligible from "./pages/NotEligible";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import DashboardAtendimento from "./pages/DashboardAtendimento";
import DashboardTratamento from "./pages/DashboardTratamento";
import DashboardConta from "./pages/DashboardConta";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminInbox from "./pages/admin/AdminInbox";
import AdminCRM from "./pages/admin/AdminCRM";
import AdminConfiguracoes from "./pages/admin/AdminConfiguracoes";

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
            <Route path="/results" element={<Results />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/not-eligible" element={<NotEligible />} />
            {/* Dashboard Routes */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/atendimento" element={<DashboardAtendimento />} />
            <Route path="/dashboard/tratamento" element={<DashboardTratamento />} />
            <Route path="/dashboard/conta" element={<DashboardConta />} />
            {/* Admin Routes */}
            <Route path="/trattum-admin" element={<AdminDashboard />} />
            <Route path="/trattum-admin/inbox" element={<AdminInbox />} />
            <Route path="/trattum-admin/crm" element={<AdminCRM />} />
            <Route path="/trattum-admin/configuracoes" element={<AdminConfiguracoes />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
