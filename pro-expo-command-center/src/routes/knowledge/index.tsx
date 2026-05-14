import { Link } from '@tanstack/react-router';
import {
  ArrowRight,
  Building2,
  Coins,
  Leaf,
  Library,
  MessageSquareQuote,
  PackageOpen,
  Users,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { seedKnowledge } from '@/data/seed';
import { formatDateShort } from '@/lib/format';
import { cn } from '@/lib/cn';

const CATEGORIES = [
  {
    id: 'voice' as const,
    label: 'Brand voice',
    icon: MessageSquareQuote,
    accent: 'magenta' as const,
    description: 'How Pro Expo writes, presents and talks to clients.',
  },
  {
    id: 'suppliers' as const,
    label: 'Suppliers',
    icon: PackageOpen,
    accent: 'teal' as const,
    description: 'Tiers, rate cards, capacity and ratings.',
  },
  {
    id: 'clients' as const,
    label: 'Clients',
    icon: Users,
    accent: 'blue' as const,
    description: 'Typology, history, contacts and previous stands.',
  },
  {
    id: 'margins' as const,
    label: 'Margins & Pricing',
    icon: Coins,
    accent: 'purple' as const,
    description: 'Standard markups, Pre-Costing matrix, reuse credit.',
  },
  {
    id: 'sustainability' as const,
    label: 'Sustainability',
    icon: Leaf,
    accent: 'teal' as const,
    description: 'Reuse protocol, materials, certifications.',
  },
  {
    id: 'venues' as const,
    label: 'Venues',
    icon: Building2,
    accent: 'magenta' as const,
    description: 'Fira, Messe Berlin, NEC, IFEMA · regs and quirks.',
  },
];

export function KnowledgePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={Library}
        eyebrow="Knowledge Base"
        title="Pro Expo intelligence, one click away."
        description="Voice, suppliers, clients, margins, sustainability and venues · the body of knowledge every agent draws from."
      />

      <Input placeholder="Search across the whole knowledge base…" className="max-w-xl" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((c) => {
          const Icon = c.icon;
          const count = seedKnowledge.filter((k) => k.category === c.id).length;
          return (
            <Link
              key={c.id}
              to="/knowledge/$category"
              params={{ category: c.id }}
              className="ring-focus group block"
            >
              <Card className="h-full transition-colors group-hover:border-mute/40">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-md border',
                        c.accent === 'magenta' && 'border-magenta/40 bg-magenta/10 text-magenta',
                        c.accent === 'teal' && 'border-teal/40 bg-teal/10 text-teal',
                        c.accent === 'blue' && 'border-blue/40 bg-blue/15 text-info',
                        c.accent === 'purple' && 'border-purple/40 bg-purple/15 text-purple',
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge tone="neutral">{count} entries</Badge>
                  </div>
                  <CardTitle className="pt-1">{c.label}</CardTitle>
                  <p className="text-2xs text-mute">{c.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-end gap-1 text-2xs text-mute transition-colors group-hover:text-teal-soft">
                    Browse <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recently updated</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border p-0">
          {seedKnowledge.map((k) => (
            <Link
              key={k.id}
              to="/knowledge/$category"
              params={{ category: k.category }}
              className="ring-focus block px-5 py-3 transition-colors hover:bg-bg-elev-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text">{k.title}</p>
                  <p className="line-clamp-1 text-2xs text-mute">{k.body}</p>
                </div>
                <div className="shrink-0 text-right">
                  <Badge tone="neutral" className="capitalize">
                    {k.category}
                  </Badge>
                  <p className="mt-1 text-2xs text-faint">{formatDateShort(k.updated_at)}</p>
                </div>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
