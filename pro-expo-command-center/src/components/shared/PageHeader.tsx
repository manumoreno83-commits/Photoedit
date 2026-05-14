import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

interface PageHeaderProps {
  icon?: LucideIcon;
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn('flex flex-wrap items-start justify-between gap-4', className)}>
      <div className="flex items-start gap-4">
        {Icon && (
          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-bg-elev shadow-elev">
            <Icon className="h-5 w-5 text-teal" />
          </div>
        )}
        <div>
          {eyebrow && (
            <p className="mb-1 font-mono text-2xs uppercase tracking-[0.18em] text-mute">
              {eyebrow}
            </p>
          )}
          <h1 className="text-balance font-display text-2xl font-semibold text-text">{title}</h1>
          {description && (
            <p className="mt-1 max-w-2xl text-balance text-sm text-mute">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
