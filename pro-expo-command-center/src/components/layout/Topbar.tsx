import { Bell, Command, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUI } from '@/store/ui';

export function Topbar() {
  const setCommandPaletteOpen = useUI((s) => s.setCommandPaletteOpen);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-border bg-bg/85 px-6 backdrop-blur-md">
      <button
        type="button"
        onClick={() => setCommandPaletteOpen(true)}
        className="ring-focus group flex w-full max-w-md items-center gap-3 rounded-md border border-border bg-bg-elev px-3 py-1.5 text-sm text-mute transition-colors hover:border-mute/40 hover:text-text"
      >
        <Search className="h-4 w-4 text-mute" />
        <span className="flex-1 text-left">Search projects, suppliers, briefs…</span>
        <kbd className="hidden items-center gap-1 rounded border border-border bg-bg-elev-2 px-1.5 py-0.5 font-mono text-2xs text-mute md:flex">
          <Command className="h-3 w-3" />K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-3">
        <Badge tone="teal" className="hidden md:inline-flex">
          <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-teal" />
          Live · 8 projects
        </Badge>

        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>

        <div className="flex h-8 items-center gap-2 rounded-full border border-border bg-bg-elev px-1 pr-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-gradient text-2xs font-bold text-white">
            MM
          </div>
          <span className="text-sm text-text">Manuel Moreno</span>
        </div>
      </div>
    </header>
  );
}
