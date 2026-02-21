import { useLocation, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { LayoutDashboard, LifeBuoy, Activity, UserCog, LogOut, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

const menuItems = [
  { title: 'Início', icon: LayoutDashboard, path: '/dashboard' },
  { title: 'Tratamento', icon: Activity, path: '/dashboard/tratamento' },
  { title: 'Notificações', icon: Bell, path: '/dashboard/notificacoes' },
  { title: 'Atendimento', icon: LifeBuoy, path: '/dashboard/atendimento' },
  { title: 'Minha Conta', icon: UserCog, path: '/dashboard/conta' },
];

export function DashboardSidebar() {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      const { count } = await supabase
        .from('notificacoes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('lida', false);
      setUnreadCount(count || 0);
    };
    fetchUnread();

    const channel = supabase
      .channel('notificacoes-badge')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notificacoes', filter: `user_id=eq.${user.id}` }, () => fetchUnread())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return (
    <Sidebar className="border-r border-border/40">
      <SidebarHeader className="p-6 border-b border-border/40">
        <Link to="/dashboard">
          <h1 className="font-serif text-2xl font-semibold text-primary tracking-wide">
            TRATTUM
          </h1>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={cn(
                        'h-12 px-4 transition-all',
                        isActive && 'bg-secondary text-primary font-medium'
                      )}
                    >
                      <Link to={item.path} className="flex items-center gap-3">
                        <item.icon className="w-5 h-5" />
                        <span>{item.title}</span>
                        {item.path === '/dashboard/notificacoes' && unreadCount > 0 && (
                          <span className="ml-auto bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1.5">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border/40">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={signOut}
              className="h-12 px-4 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="w-5 h-5" />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
