import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  ShoppingBag,
  Settings,
  UserCog,
  HeartPulse,
  type LucideIcon,
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { cn } from '@/lib/utils';

type AppRole = 'admin' | 'medico' | 'assistente';

interface NavItem {
  label: string;
  shortLabel: string;
  to: string;
  icon: LucideIcon;
  roles: AppRole[];
  exact?: boolean;
}

const items: NavItem[] = [
  { label: 'Dashboard', shortLabel: 'Dashboard', to: '/trattum-admin', icon: LayoutDashboard, roles: ['admin', 'medico'], exact: true },
  { label: 'Atendimento', shortLabel: 'Atend.', to: '/trattum-admin/atendimento', icon: ClipboardList, roles: ['admin', 'medico', 'assistente'] },
  { label: 'Acompanhamento', shortLabel: 'Acomp.', to: '/trattum-admin/acompanhamento', icon: HeartPulse, roles: ['admin', 'medico'] },
  { label: 'Pedidos', shortLabel: 'Pedidos', to: '/trattum-admin/pedidos', icon: ShoppingBag, roles: ['admin', 'medico'] },
  { label: 'Usuários', shortLabel: 'Usuários', to: '/trattum-admin/usuarios', icon: UserCog, roles: ['admin'] },
  { label: 'Configurações', shortLabel: 'Config.', to: '/trattum-admin/configuracoes', icon: Settings, roles: ['admin', 'medico'] },
];

export function AdminBottomNav() {
  const { userRole } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const visible = items.filter(i => !userRole || i.roles.includes(userRole as AppRole));
  if (visible.length === 0) return null;

  const isActive = (item: NavItem) =>
    item.exact ? location.pathname === item.to : location.pathname === item.to || location.pathname.startsWith(item.to + '/');

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Navegação administrativa"
    >
      <ul
        className="grid"
        style={{ gridTemplateColumns: `repeat(${visible.length}, minmax(0, 1fr))`, minHeight: 56 }}
      >
        {visible.map(item => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <button
                onClick={() => navigate(item.to)}
                className={cn(
                  'w-full h-full flex flex-col items-center justify-center gap-0.5 py-1.5 min-h-[44px] transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="h-6 w-6" strokeWidth={active ? 2.25 : 2} />
                <span className="text-[10px] font-medium leading-tight">{item.shortLabel}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
