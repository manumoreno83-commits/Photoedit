import { cn } from '@/lib/cn';

interface ProgressProps {
  value: number; // 0..100
  tone?: 'teal' | 'magenta' | 'warning';
  className?: string;
}

export function Progress({ value, tone = 'teal', className }: ProgressProps) {
  const v = Math.max(0, Math.min(100, value));
  const bar =
    tone === 'magenta'
      ? 'bg-brand-gradient'
      : tone === 'warning'
        ? 'bg-warning'
        : 'bg-teal-gradient';
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-bg-elev-3', className)}>
      <div className={cn('h-full rounded-full transition-all', bar)} style={{ width: `${v}%` }} />
    </div>
  );
}
