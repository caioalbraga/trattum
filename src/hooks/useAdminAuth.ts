import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type AppRole = 'admin' | 'user' | 'medico' | 'assistente' | 'nutricionista';

export function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate('/auth');
          return;
        }

        setUser(session.user);

        // Check roles: admin, medico, assistente
        const { data: roles, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id);

        if (error) {
          console.error('Error checking roles:', error);
          toast({
            title: "Erro de acesso",
            description: "Não foi possível verificar suas permissões.",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        const roleList = roles?.map(r => r.role as AppRole) || [];
        
        // Determine primary role (priority: admin > medico > assistente)
        let primaryRole: AppRole | null = null;
        if (roleList.includes('admin')) primaryRole = 'admin';
        else if (roleList.includes('medico')) primaryRole = 'medico';
        else if (roleList.includes('assistente')) primaryRole = 'assistente';

        if (!primaryRole) {
          toast({
            title: "Acesso negado",
            description: "Você não tem permissão para acessar esta área.",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        setUserRole(primaryRole);
        setIsAdmin(true);
      } catch (error) {
        console.error('Admin auth error:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        navigate('/auth');
      }
    });

    checkAdminAccess();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  return { isAdmin, loading, user, userRole };
}
