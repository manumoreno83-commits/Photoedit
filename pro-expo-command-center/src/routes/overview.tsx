import { Link } from '@tanstack/react-router';
import {
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatTile } from '@/components/shared/StatTile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { seedProjects } from '@/data/seed';
import { AGENTS } from '@/data/agents';
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

export function OverviewPage() {
  const active = seedProjects.filter((p) => !['closed', 'lost'].includes(p.stage));
  const pipelineValue = active.reduce((sum, p) => sum + (p.pvp_client ?? 0), 0);
  const totalSavings = AGENTS.reduce((s, a) => s + a.estimatedSavingHrYear, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Sparkles}
        eyebrow="Today · 13 May 2026"
        title="Good morning, Manuel."
        description="8 active projects across InnoTrans, MWC and ISE windows. Three decisions waiting on you below."
        actions={
          <>
            <Button variant="secondary">View digest</Button>
            <Button variant="teal" asChild>
              <Link to="/operations-center">
                Run Orchestrator <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Active projects"
          value={String(active.length)}
          icon={Building2}
          hint="Across 6 events"
          delta={{ value: '+2 vs last week', tone: 'up' }}
        />
        <StatTile
          label="Pipeline PVP"
          value={formatEUR(pipelineValue)}
          icon={TrendingUp}
          hint="Active stages only"
          delta={{ value: '+18% MoM', tone: 'up' }}
        />
        <StatTile
          label="Gates pending"
          value="4"
          icon={CheckCircle2}
          hint="Quality Gates 1-4"
          delta={{ value: '2 expiring this week', tone: 'down' }}
        />
        <StatTile
          label="Annual hrs reclaimed"
          value={`${totalSavings.toLocaleString()} h`}
          icon={Clock}
          hint="If 6 agents run at target"
          delta={{ value: 'Est. ROI', tone: 'neutral' }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Active projects</CardTitle>
              <p className="text-2xs text-mute">Top of cockpit · ordered by setup proximity</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/cockpit">
                Open Cockpit <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {active.slice(0, 6).map((p) => {
                const setupDate = p.setup_start ? new Date(p.setup_start) : null;
                const daysToSetup = setupDate
                  ? Math.ceil((setupDate.getTime() - Date.now()) / 86400000)
                  : null;
                return (
                  <li key={p.id}>
                    <Link
                      to="/cockpit/$projectId"
                      params={{ projectId: p.id }}
                      className="ring-focus flex items-center gap-4 px-5 py-3 transition-colors hover:bg-bg-elev-2"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-bg-elev font-mono text-2xs font-semibold text-mute">
                        {p.pm_initials ?? '-'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-medium text-text">{p.client}</p>
                          <Badge tone={STAGE_TONE[p.stage]}>{p.stage}</Badge>
                          {p.classification === 'strategic' && (
                            <Badge tone="magenta">strategic</Badge>
                          )}
                        </div>
                        <p className="truncate text-2xs text-mute">
                          {p.event} · {p.sqm} sqm · {formatEUR(p.pvp_client)}
                        </p>
                      </div>
                      <div className="hidden text-right md:block">
                        <p className="text-2xs text-mute">Setup</p>
                        <p
                          className={cn(
                            'font-mono text-xs',
                            daysToSetup != null && daysToSetup < 21
                              ? 'text-warning'
                              : 'text-text',
                          )}
                        >
                          {formatDateShort(p.setup_start)}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-mute" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Decisions waiting</CardTitle>
            <p className="text-2xs text-mute">Borderline & off-track items the orchestrator flagged</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <DecisionRow
              tone="warning"
              title="Pandrol · 416 sqm @ €400k"
              body="Borderline classification (250k objetivo, strategic client). OD call required within 24h."
              eta="6h"
            />
            <DecisionRow
              tone="danger"
              title="Reflex on watch (B rating)"
              body="2 consecutive < 4.0 ratings. ISE Focal incident. Reduce concurrent by 1 or activate backup."
              eta="this week"
            />
            <DecisionRow
              tone="teal"
              title="ZTE MWC · Gate 2 ready"
              body="22 of 22 items uploaded. Quality Gate Agent recommends GO; one-click email below."
              eta="now"
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Agent activity</CardTitle>
            <p className="text-2xs text-mute">Estimated annual hours reclaimed per agent</p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/operations-center">
              Open Operations Center <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {AGENTS.map((a) => {
            const max = Math.max(...AGENTS.map((x) => x.estimatedSavingHrYear));
            const pct = Math.round((a.estimatedSavingHrYear / max) * 100);
            const Icon = a.icon;
            return (
              <Link
                key={a.id}
                to="/operations-center/$agentId"
                params={{ agentId: a.id }}
                className="ring-focus group rounded-md border border-border bg-bg-elev/60 p-4 transition-all hover:border-mute/40 hover:bg-bg-elev"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-md border',
                      a.accent === 'magenta' && 'border-magenta/30 bg-magenta/10 text-magenta',
                      a.accent === 'purple' && 'border-purple/30 bg-purple/15 text-purple',
                      a.accent === 'teal' && 'border-teal/30 bg-teal/10 text-teal',
                      a.accent === 'blue' && 'border-blue/30 bg-blue/15 text-info',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-text group-hover:text-teal-soft">
                      {a.name}
                    </p>
                    <p className="truncate text-2xs text-mute">{a.tagline}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-2xs text-mute">
                  <span className="font-mono">{a.estimatedSavingHrYear} h / year</span>
                  <span className="font-mono uppercase">{a.model.split('-').slice(0, 3).join(' ')}</span>
                </div>
                <Progress value={pct} tone={a.accent === 'magenta' ? 'magenta' : 'teal'} className="mt-2" />
              </Link>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function DecisionRow({
  tone,
  title,
  body,
  eta,
}: {
  tone: 'warning' | 'danger' | 'teal';
  title: string;
  body: string;
  eta: string;
}) {
  return (
    <div className="space-y-1.5 rounded-md border border-border bg-bg-elev-2/60 p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-text">{title}</p>
        <Badge tone={tone === 'teal' ? 'success' : tone}>{eta}</Badge>
      </div>
      <p className="text-2xs leading-relaxed text-mute">{body}</p>
      <div className="flex items-center gap-2 pt-1">
        <Calendar className="h-3 w-3 text-faint" />
        <button className="text-2xs font-medium text-teal-soft hover:underline">Review →</button>
      </div>
    </div>
  );
}
