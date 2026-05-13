import { Link, useParams } from '@tanstack/react-router';
import { ArrowLeft, Building2, CalendarDays, ChevronRight, Euro, Layers } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatTile } from '@/components/shared/StatTile';
import { Empty } from '@/components/ui/empty';
import { Progress } from '@/components/ui/progress';
import { seedProjects, seedSuppliers } from '@/data/seed';
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

const GATES = [
  { n: 1, label: 'Pre-Production', items: 14 },
  { n: 2, label: 'Ready to Ship', items: 8 },
  { n: 3, label: 'Onsite Setup', items: 8 },
  { n: 4, label: 'Project Closed', items: 9 },
] as const;

export function ProjectDetailPage() {
  const params = useParams({ strict: false }) as { projectId?: string };
  const project = seedProjects.find((p) => p.id === params.projectId);

  if (!project) {
    return (
      <Empty
        icon={Building2}
        title="Project not found"
        description="Open the cockpit to pick a project."
        action={
          <Button asChild variant="secondary">
            <Link to="/cockpit">Back to Cockpit</Link>
          </Button>
        }
      />
    );
  }

  // Mock RFQs from suppliers
  const rfqs = seedSuppliers.slice(0, 4).map((s, i) => ({
    supplier: s,
    amount: project.precio_objetivo
      ? Math.round(project.precio_objetivo * (0.92 + i * 0.06))
      : null,
    status:
      i === 0 ? ('confirmed' as const) : i === 1 ? ('received' as const) : ('pending' as const),
  }));

  const margin =
    project.pvp_client && project.precio_objetivo
      ? (project.pvp_client - project.precio_objetivo) / project.pvp_client
      : null;

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1.5 text-2xs text-mute">
        <Link to="/cockpit" className="hover:text-text">
          Cockpit
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-text">{project.code}</span>
      </nav>

      <PageHeader
        icon={Building2}
        eyebrow={`${project.event} · ${project.venue ?? '—'}`}
        title={`${project.client} — ${project.code}`}
        description={`${project.sqm} sqm · ${project.classification.toUpperCase()} · PM ${project.pm_initials ?? '—'}${project.creative_lead ? ` · Creative ${project.creative_lead}` : ''}`}
        actions={
          <>
            <Button variant="ghost" asChild>
              <Link to="/cockpit">
                <ArrowLeft className="h-4 w-4" /> Cockpit
              </Link>
            </Button>
            <Button variant="teal">Run Orchestrator</Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={STAGE_TONE[project.stage]}>{project.stage}</Badge>
        <Badge tone={project.classification === 'strategic' ? 'magenta' : 'neutral'}>
          {project.classification}
        </Badge>
        {project.client_typology && (
          <Badge tone="purple">{project.client_typology.replace('_', ' ')}</Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="PVP cliente" value={formatEUR(project.pvp_client)} icon={Euro} />
        <StatTile label="Precio objetivo" value={formatEUR(project.precio_objetivo)} icon={Layers} />
        <StatTile
          label="Margen target"
          value={margin == null ? '—' : `${Math.round(margin * 100)}%`}
          hint={margin != null && margin < 0.35 ? 'Below 35% threshold' : 'On target'}
          delta={
            margin != null
              ? { value: margin >= 0.35 ? 'OK' : 'Watch', tone: margin >= 0.35 ? 'up' : 'down' }
              : undefined
          }
        />
        <StatTile label="Setup" value={formatDateShort(project.setup_start)} icon={CalendarDays} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quality Gates</CardTitle>
            <p className="text-2xs text-mute">
              Ops Manual §6 · 43 items across 4 gates · validated by Ops Director
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {GATES.map((g, i) => {
              // Mock progress: first gates fuller, later gates emptier based on stage
              const stagesOrder = ['briefing', 'design', 'quotation', 'delivered', 'won', 'production', 'setup', 'closed'];
              const stageIdx = stagesOrder.indexOf(project.stage);
              const gateBaseline = i * 2;
              const pct = Math.max(0, Math.min(100, (stageIdx - gateBaseline) * 35));
              const tone: 'teal' | 'magenta' | 'warning' =
                pct >= 100 ? 'teal' : pct > 0 ? 'magenta' : 'warning';
              return (
                <div
                  key={g.n}
                  className="rounded-md border border-border bg-bg-elev-2/50 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-text">
                        Gate {g.n} · {g.label}
                      </p>
                      <p className="text-2xs text-mute">{g.items} checklist items</p>
                    </div>
                    <Badge tone={pct >= 100 ? 'success' : pct > 0 ? 'magenta' : 'neutral'}>
                      {pct >= 100 ? 'GO' : pct > 0 ? `${pct}%` : 'pending'}
                    </Badge>
                  </div>
                  <Progress value={pct} tone={tone} className="mt-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>RFQ — Comparativa</CardTitle>
            <p className="text-2xs text-mute">Top 4 supplier quotes (Procurement Agent)</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {rfqs.map(({ supplier, amount, status }) => (
              <div
                key={supplier.id}
                className="flex items-center gap-3 rounded-md border border-border bg-bg-elev-2/40 p-2.5"
              >
                <div
                  className={cn(
                    'h-7 w-7 shrink-0 rounded-md border bg-bg-elev font-mono text-2xs',
                    'flex items-center justify-center font-semibold text-mute',
                  )}
                >
                  T{supplier.tier}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text">{supplier.name}</p>
                  <p className="truncate text-2xs text-mute">{supplier.country}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xs text-text">{formatEUR(amount)}</p>
                  <Badge
                    tone={
                      status === 'confirmed' ? 'success' : status === 'received' ? 'teal' : 'warning'
                    }
                    className="mt-1"
                  >
                    {status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
