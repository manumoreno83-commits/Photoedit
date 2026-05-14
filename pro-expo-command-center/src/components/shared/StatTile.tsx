import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

interface StatTileProps {
  label: string;
  value: string;
  delta?: { value: string; tone: 'up' | 'down' | 'neutral' };
  icon?: LucideIcon;
  hint?: string;
  className?: string;
}

export function StatTile({ label, value, delta, icon: Icon, hint, className }: StatTileProps) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-lg border border-border bg-bg-elev/80 p-4 shadow-elev transition-colors hover:border-mute/30',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-2xs font-medium uppercase tracking-wider text-mute">{label}</p>
          <p className="mt-1 font-display text-2xl font-semibold tracking-tight text-text">
            {value}
          </p>
          {hint && <p className="mt-1 text-2xs text-faint">{hint}</p>}
        </div>
        {Icon && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-bg-elev-2 text-mute">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      {delta && (
        <p
          className={cn(
            'mt-3 inline-flex items-center gap-1 font-mono text-2xs font-medium',
            delta.tone === 'up' && 'text-teal-soft',
            delta.tone === 'down' && 'text-danger',
            delta.tone === 'neutral' && 'text-mute',
          )}
        >
          {delta.value}
        </p>
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-brand-gradient opacity-0 transition-opacity group-hover:opacity-60" />
    </div>
  );
}
