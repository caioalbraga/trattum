import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ClipboardList, 
  ShoppingBag, 
  Settings,
  LogOut,
  MessageCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { NavLink } from '@/components/NavLink';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const menuItems = [
  { title: 'Dashboard', url: '/trattum-admin', icon: LayoutDashboard },
  { title: 'Triagem', url: '/trattum-admin/inbox', icon: ClipboardList },
  { title: 'Pedidos', url: '/trattum-admin/pedidos', icon: ShoppingBag },
  { title: 'Configurações', url: '/trattum-admin/configuracoes', icon: Settings },
];

export function AdminSidebar() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Até logo!",
      description: "Você saiu do painel administrativo.",
    });
    navigate('/');
  };

  return (
    <Sidebar className="border-r border-border/60 bg-card w-[220px]">
      <SidebarHeader className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-lg font-semibold text-foreground">
              Trattum
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Painel Clínico
            </p>
          </div>
          <SidebarTrigger className="h-8 w-8" />
        </div>
      </SidebarHeader>
      
      <Separator className="bg-border/60" />
      
      <SidebarContent className="p-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === '/trattum-admin'}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg",
                        "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                        "transition-colors duration-150"
                      )}
                      activeClassName="bg-primary/5 text-foreground font-medium border border-border/60"
                    >
                      <item.icon className="h-[18px] w-[18px]" />
                      <span className="text-sm">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 mt-auto">
        <Separator className="bg-border/60 mb-3" />
        
        <Button 
          variant="ghost" 
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 mb-1"
          onClick={openWhatsApp}
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          <span className="text-sm">Suporte WhatsApp</span>
        </Button>

        <Button 
          variant="ghost" 
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          <span className="text-sm">Sair</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
