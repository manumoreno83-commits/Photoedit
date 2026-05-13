import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-2xs font-medium',
  {
    variants: {
      tone: {
        neutral: 'border-border bg-bg-elev text-mute',
        teal: 'border-teal/40 bg-teal/10 text-teal-soft',
        magenta: 'border-magenta/40 bg-magenta/10 text-magenta',
        purple: 'border-purple/40 bg-purple/15 text-purple',
        blue: 'border-blue/40 bg-blue/15 text-info',
        success: 'border-success/40 bg-success/10 text-teal-soft',
        warning: 'border-warning/40 bg-warning/10 text-warning',
        danger: 'border-danger/40 bg-danger/10 text-danger',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = ({ className, tone, ...props }: BadgeProps) => (
  <span className={cn(badgeVariants({ tone }), className)} {...props} />
);
