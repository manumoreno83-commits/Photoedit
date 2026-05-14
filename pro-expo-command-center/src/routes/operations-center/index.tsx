import { Link } from '@tanstack/react-router';
import { ArrowRight, Bot, Clock, Cpu, Layers } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatTile } from '@/components/shared/StatTile';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AGENTS } from '@/data/agents';
import { cn } from '@/lib/cn';

export function OperationsCenterPage() {
  const totalHours = AGENTS.reduce((s, a) => s + a.estimatedSavingHrYear, 0);
  const sonnet = AGENTS.filter((a) => a.model === 'claude-sonnet-4-6').length;
  const opus = AGENTS.filter((a) => a.model === 'claude-opus-4-7').length;
  const live = AGENTS.filter((a) => a.status === 'live').length;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Bot}
        eyebrow="Operations Center"
        title="Nine agents, one Operations Director."
        description="Each agent replaces a high-cost, high-stability process. Sonnet 4.6 for routine, Opus 4.7 for the heavy reasoning."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Agents" value={String(AGENTS.length)} icon={Bot} hint={`${live} live`} />
        <StatTile
          label="Hrs/year reclaimed"
          value={totalHours.toLocaleString()}
          icon={Clock}
          hint="If all hit target"
        />
        <StatTile
          label="Sonnet 4.6 / Opus 4.7"
          value={`${sonnet} · ${opus}`}
          icon={Cpu}
          hint="Cost-optimized routing"
        />
        <StatTile
          label="Knowledge docs"
          value="5"
          icon={Layers}
          hint="Voice · Tiering · Margins · Sustain · Suppliers"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {AGENTS.map((a) => {
          const Icon = a.icon;
          return (
            <Card key={a.id} className="group relative overflow-hidden">
              <div
                className={cn(
                  'absolute -right-12 -top-12 h-32 w-32 rounded-full blur-2xl opacity-50 transition-opacity group-hover:opacity-80',
                  a.accent === 'magenta' && 'bg-magenta/30',
                  a.accent === 'purple' && 'bg-purple/30',
                  a.accent === 'teal' && 'bg-teal/30',
                  a.accent === 'blue' && 'bg-blue/40',
                )}
              />
              <CardHeader className="relative">
                <div className="flex items-start justify-between gap-2">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-md border',
                      a.accent === 'magenta' && 'border-magenta/40 bg-magenta/10 text-magenta',
                      a.accent === 'purple' && 'border-purple/40 bg-purple/15 text-purple',
                      a.accent === 'teal' && 'border-teal/40 bg-teal/10 text-teal',
                      a.accent === 'blue' && 'border-blue/40 bg-blue/15 text-info',
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <Badge tone={a.model.includes('opus') ? 'magenta' : 'neutral'}>
                    {a.model.includes('opus') ? 'Opus 4.7' : 'Sonnet 4.6'}
                  </Badge>
                </div>
                <CardTitle className="pt-1">{a.name}</CardTitle>
                <p className="text-2xs text-mute">{a.tagline}</p>
              </CardHeader>
              <CardContent className="relative space-y-3">
                <p className="text-sm leading-relaxed text-mute">{a.description}</p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Metric label="Saves" value={`${a.estimatedSavingHrYear} h/yr`} />
                  <Metric label="Stability" value={`${a.stability}/5`} />
                </div>
                <div className="rounded-md border border-border bg-bg-elev-2/60 p-2.5">
                  <p className="text-2xs font-medium uppercase tracking-wider text-faint">Replaces</p>
                  <p className="mt-0.5 text-2xs text-mute">{a.replaces}</p>
                </div>
              </CardContent>
              <CardFooter className="relative justify-between">
                <span className="text-2xs text-faint">{a.source}</span>
                <Button size="sm" variant="ghost" asChild>
                  <Link to="/operations-center/$agentId" params={{ agentId: a.id }}>
                    Open <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-bg-elev/60 px-2.5 py-1.5">
      <p className="text-2xs font-medium uppercase tracking-wider text-faint">{label}</p>
      <p className="mt-0.5 font-mono text-xs text-text">{value}</p>
    </div>
  );
}
