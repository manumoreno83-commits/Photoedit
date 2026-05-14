import { Link } from '@tanstack/react-router';
import { ChevronRight, Filter, Gauge, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { seedProjects } from '@/data/seed';
import type { ProjectStage } from '@/types/db';
import { formatEUR, formatDateShort } from '@/lib/format';
import { cn } from '@/lib/cn';

const STAGE_TONE = {
  briefing: 'neutral',
  design: 'purple',
  quotation: 'magenta',
  delivered: 'blue',
  won: 'success',
  lost: 'danger',
  production: 'teal',
  setup: 'warning',
  closed: 'neutral',
} as const;

const STAGES: ProjectStage[] = [
  'briefing',
  'design',
  'quotation',
  'delivered',
  'won',
  'production',
  'setup',
  'closed',
];

export function CockpitPage() {
  const [q, setQ] = useState('');
  const [stage, setStage] = useState<ProjectStage | 'all'>('all');

  const filtered = useMemo(() => {
    return seedProjects.filter((p) => {
      if (stage !== 'all' && p.stage !== stage) return false;
      if (q && !`${p.client} ${p.event} ${p.code}`.toLowerCase().includes(q.toLowerCase()))
        return false;
      return true;
    });
  }, [q, stage]);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Gauge}
        eyebrow="Operations Cockpit"
        title="Live project ops"
        description="Every active and recent project across all events. Click any row for the full stand profile, gates and CE."
        actions={
          <>
            <Button variant="secondary">
              <Filter className="h-4 w-4" /> Filters
            </Button>
            <Button variant="teal">
              <Plus className="h-4 w-4" /> New project
            </Button>
          </>
        }
      />

      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Input
              placeholder="Search by client, event, code…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="max-w-sm"
            />
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setStage('all')}
                className={cn(
                  'ring-focus rounded-full border px-3 py-1 text-2xs transition-colors',
                  stage === 'all'
                    ? 'border-teal/40 bg-teal/10 text-teal-soft'
                    : 'border-border text-mute hover:text-text',
                )}
              >
                All
              </button>
              {STAGES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStage(s)}
                  className={cn(
                    'ring-focus rounded-full border px-3 py-1 text-2xs capitalize transition-colors',
                    stage === s
                      ? 'border-teal/40 bg-teal/10 text-teal-soft'
                      : 'border-border text-mute hover:text-text',
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-y border-border bg-bg-elev-2/60 text-2xs uppercase tracking-wider text-mute">
              <tr>
                <Th>Code · Client</Th>
                <Th>Event · Venue</Th>
                <Th align="right">sqm</Th>
                <Th align="right">PVP cliente</Th>
                <Th align="right">Objetivo</Th>
                <Th>Stage</Th>
                <Th>Setup</Th>
                <Th align="right">PM</Th>
                <Th />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p) => (
                <tr key={p.id} className="group hover:bg-bg-elev-2">
                  <Td>
                    <Link
                      to="/cockpit/$projectId"
                      params={{ projectId: p.id }}
                      className="block"
                    >
                      <p className="font-mono text-2xs uppercase tracking-wider text-faint">
                        {p.code}
                      </p>
                      <p className="font-medium text-text">{p.client}</p>
                    </Link>
                  </Td>
                  <Td>
                    <p className="text-text">{p.event}</p>
                    <p className="text-2xs text-mute">
                      {[p.venue, p.hall && `H${p.hall}`, p.stand_no].filter(Boolean).join(' · ')}
                    </p>
                  </Td>
                  <Td align="right">
                    <span className="font-mono text-text">{p.sqm}</span>
                  </Td>
                  <Td align="right">
                    <span className="font-mono text-text">{formatEUR(p.pvp_client)}</span>
                  </Td>
                  <Td align="right">
                    <span className="font-mono text-mute">{formatEUR(p.precio_objetivo)}</span>
                  </Td>
                  <Td>
                    <Badge tone={STAGE_TONE[p.stage]}>{p.stage}</Badge>
                    {p.classification === 'strategic' && (
                      <Badge tone="magenta" className="ml-1.5">
                        strategic
                      </Badge>
                    )}
                  </Td>
                  <Td>
                    <span className="text-mute">{formatDateShort(p.setup_start)}</span>
                  </Td>
                  <Td align="right">
                    <span className="font-mono text-2xs text-mute">{p.pm_initials ?? '-'}</span>
                  </Td>
                  <Td align="right">
                    <Link
                      to="/cockpit/$projectId"
                      params={{ projectId: p.id }}
                      className="inline-flex items-center text-mute group-hover:text-teal-soft"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-sm text-mute">
                    No projects match the current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function Th({
  children,
  align = 'left',
}: {
  children?: React.ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <th
      className={cn(
        'px-4 py-2 font-medium',
        align === 'right' ? 'text-right' : 'text-left',
      )}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = 'left',
}: {
  children?: React.ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <td
      className={cn(
        'whitespace-nowrap px-4 py-3 align-top',
        align === 'right' ? 'text-right' : 'text-left',
      )}
    >
      {children}
    </td>
  );
}

export { CockpitPage as default };
