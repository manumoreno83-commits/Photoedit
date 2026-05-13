import { Link, useRouterState } from '@tanstack/react-router';
import {
  Bot,
  ChevronsLeft,
  ChevronsRight,
  Gauge,
  Library,
  PanelsTopLeft,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useUI } from '@/store/ui';

interface NavItem {
  to: string;
  label: string;
  icon: typeof Gauge;
  description: string;
}

const navItems: NavItem[] = [
  {
    to: '/',
    label: 'Overview',
    icon: PanelsTopLeft,
    description: 'Today across all surfaces',
  },
  {
    to: '/operations-center',
    label: 'Operations Center',
    icon: Bot,
    description: '6 specialised agents',
  },
  {
    to: '/cockpit',
    label: 'Operations Cockpit',
    icon: Gauge,
    description: 'Live project ops',
  },
  {
    to: '/knowledge',
    label: 'Knowledge Base',
    icon: Library,
    description: 'Voice, suppliers, margins',
  },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUI();
  const { location } = useRouterState();

  return (
    <aside
      className={cn(
        'sticky top-0 flex h-screen shrink-0 flex-col border-r border-border bg-bg-elev/80 backdrop-blur-md transition-[width] duration-200',
        sidebarCollapsed ? 'w-[68px]' : 'w-[248px]',
      )}
    >
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-gradient shadow-glow-magenta">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        {!sidebarCollapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm font-semibold leading-tight text-text">
              Pro Expo
            </p>
            <p className="truncate text-2xs text-mute">Operations Center</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const active =
            item.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'group flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors',
                active
                  ? 'border border-teal/30 bg-teal/10 text-teal-soft shadow-glow'
                  : 'border border-transparent text-mute hover:bg-bg-elev-2 hover:text-text',
              )}
            >
              <Icon
                className={cn(
                  'h-4 w-4 shrink-0',
                  active ? 'text-teal' : 'text-mute group-hover:text-text',
                )}
              />
              {!sidebarCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium leading-tight">{item.label}</p>
                  <p className="truncate text-2xs text-faint">{item.description}</p>
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-2">
        <button
          type="button"
          onClick={toggleSidebar}
          className="ring-focus flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-sm text-mute transition-colors hover:bg-bg-elev-2 hover:text-text"
        >
          {sidebarCollapsed ? (
            <ChevronsRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronsLeft className="h-4 w-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
