import { cn } from '@/lib/cn';
import type { LucideIcon } from 'lucide-react';

interface EmptyProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  className?: string;
  action?: React.ReactNode;
}

export function Empty({ icon: Icon, title, description, action, className }: EmptyProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-bg-elev/40 p-10 text-center',
        className,
      )}
    >
      {Icon && (
        <div className="rounded-full border border-border bg-bg-elev-2 p-3 text-mute">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div className="space-y-1">
        <p className="font-display text-sm font-semibold text-text">{title}</p>
        {description && <p className="max-w-md text-sm text-mute">{description}</p>}
      </div>
      {action}
    </div>
  );
}
