import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AdminSidebar } from './AdminSidebar';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Loader2 } from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

// Routes accessible by each role
const roleRoutes: Record<string, string[]> = {
  admin: ['/trattum-admin', '/trattum-admin/inbox', '/trattum-admin/pedidos', '/trattum-admin/configuracoes', '/trattum-admin/usuarios'],
  medico: ['/trattum-admin', '/trattum-admin/inbox', '/trattum-admin/pedidos', '/trattum-admin/configuracoes'],
  assistente: ['/trattum-admin/inbox'],
};

export function AdminLayout({ children }: AdminLayoutProps) {
  const { isAdmin, loading, userRole } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Route protection: redirect if role doesn't have access
  useEffect(() => {
    if (loading || !isAdmin || !userRole) return;

    const allowedRoutes = roleRoutes[userRole] || [];
    const currentPath = location.pathname;
    
    const hasAccess = allowedRoutes.some(route => 
      currentPath === route || (route !== '/trattum-admin' && currentPath.startsWith(route + '/'))
    );

    if (!hasAccess) {
      // Redirect to first allowed route
      const defaultRoute = allowedRoutes[0] || '/';
      navigate(defaultRoute, { replace: true });
    }
  }, [loading, isAdmin, userRole, location.pathname, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[hsl(40,20%,97%)] dark:bg-background">
        <AdminSidebar userRole={userRole as any} />
        <main className="flex-1 p-8 lg:p-10 overflow-auto">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
