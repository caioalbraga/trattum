import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type AppRole = 'admin' | 'user';

export function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
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

        // Check if user has admin role using the has_role function
        const { data, error } = await supabase
          .rpc('has_role', { 
            _user_id: session.user.id, 
            _role: 'admin' as AppRole 
          });

        if (error) {
          console.error('Error checking admin role:', error);
          toast({
            title: "Erro de acesso",
            description: "Não foi possível verificar suas permissões.",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        if (!data) {
          toast({
            title: "Acesso negado",
            description: "Você não tem permissão para acessar esta área.",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error('Admin auth error:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate('/auth');
      }
    });

    checkAdminAccess();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  return { isAdmin, loading, user };
}
