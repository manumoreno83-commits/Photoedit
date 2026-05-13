import { Link, useParams } from '@tanstack/react-router';
import { ArrowLeft, ChevronRight, Library } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Empty } from '@/components/ui/empty';
import { seedKnowledge, seedSuppliers } from '@/data/seed';
import { formatDateShort } from '@/lib/format';
import type { KnowledgeEntry } from '@/types/db';

const TITLES: Record<KnowledgeEntry['category'], string> = {
  voice: 'Brand voice',
  suppliers: 'Suppliers',
  clients: 'Clients',
  margins: 'Margins & Pricing',
  sustainability: 'Sustainability',
  venues: 'Venues',
};

export function KnowledgeCategoryPage() {
  const params = useParams({ strict: false }) as { category?: KnowledgeEntry['category'] };
  const cat = params.category;

  if (!cat || !(cat in TITLES)) {
    return (
      <Empty
        icon={Library}
        title="Unknown category"
        action={
          <Button asChild variant="secondary">
            <Link to="/knowledge">Back to Knowledge Base</Link>
          </Button>
        }
      />
    );
  }

  const entries = seedKnowledge.filter((k) => k.category === cat);

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1.5 text-2xs text-mute">
        <Link to="/knowledge" className="hover:text-text">
          Knowledge
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-text capitalize">{TITLES[cat]}</span>
      </nav>

      <PageHeader
        icon={Library}
        eyebrow="Knowledge Base"
        title={TITLES[cat]}
        actions={
          <Button variant="ghost" asChild>
            <Link to="/knowledge">
              <ArrowLeft className="h-4 w-4" /> All categories
            </Link>
          </Button>
        }
      />

      {cat === 'suppliers' && (
        <Card>
          <CardHeader>
            <CardTitle>Capacity Dashboard</CardTitle>
            <p className="text-2xs text-mute">Tier 1 builders · live state</p>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-y border-border bg-bg-elev-2/60 text-2xs uppercase tracking-wider text-mute">
                <tr>
                  <th className="px-4 py-2 text-left">Supplier</th>
                  <th className="px-4 py-2 text-left">Country · Category</th>
                  <th className="px-4 py-2 text-right">Max</th>
                  <th className="px-4 py-2 text-right">Active</th>
                  <th className="px-4 py-2 text-right">Rating</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {seedSuppliers.map((s) => {
                  const status =
                    s.active_projects >= s.max_concurrent
                      ? { label: 'FULL', tone: 'danger' as const }
                      : s.active_projects >= s.max_concurrent - 1
                        ? { label: 'CAUTION', tone: 'warning' as const }
                        : { label: 'OK', tone: 'success' as const };
                  return (
                    <tr key={s.id} className="hover:bg-bg-elev-2">
                      <td className="px-4 py-3">
                        <p className="font-medium text-text">{s.name}</p>
                        <p className="text-2xs text-mute">Tier {s.tier}</p>
                      </td>
                      <td className="px-4 py-3 text-mute">
                        {s.country} · {s.category}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">{s.max_concurrent}</td>
                      <td className="px-4 py-3 text-right font-mono">{s.active_projects}</td>
                      <td className="px-4 py-3 text-right font-mono">
                        {s.rating?.toFixed(1) ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={status.tone}>{status.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {entries.length === 0 && (
          <Empty
            icon={Library}
            title="No entries yet"
            description="Add the first entry for this category to start training the agents on it."
            className="lg:col-span-2"
          />
        )}
        {entries.map((k) => (
          <Card key={k.id}>
            <CardHeader>
              <CardTitle>{k.title}</CardTitle>
              <p className="text-2xs text-faint">Updated {formatDateShort(k.updated_at)}</p>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-text">{k.body}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {k.tags.map((t) => (
                  <Badge key={t} tone="neutral">
                    #{t}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
