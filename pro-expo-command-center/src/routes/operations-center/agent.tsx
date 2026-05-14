import { Link, useParams } from '@tanstack/react-router';
import { ArrowLeft, ChevronRight, Play, Sparkles } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Empty } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { AGENTS_BY_ID, type AgentId } from '@/data/agents';
import { invokeAgent } from '@/lib/supabase';
import { seedProjects } from '@/data/seed';
import { cn } from '@/lib/cn';

export function AgentDetailPage() {
  const params = useParams({ strict: false }) as { agentId?: string };
  const agent = params.agentId && (AGENTS_BY_ID as Record<string, (typeof AGENTS_BY_ID)[AgentId]>)[params.agentId];

  const [projectId, setProjectId] = useState(seedProjects[0]?.id ?? '');
  const [extraPrompt, setExtraPrompt] = useState('');

  const run = useMutation({
    mutationFn: async () => {
      if (!agent) throw new Error('Unknown agent');
      const { data, error } = await invokeAgent(agent.edgeFn, {
        projectId,
        instructions: extraPrompt || null,
      });
      if (error) throw error;
      return data;
    },
  });

  if (!agent) {
    return (
      <Empty
        icon={Sparkles}
        title="Agent not found"
        description="The agent ID is unknown. Open the Operations Center to pick one of the six."
        action={
          <Button asChild variant="secondary">
            <Link to="/operations-center">Back to Operations Center</Link>
          </Button>
        }
      />
    );
  }

  const Icon = agent.icon;

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1.5 text-2xs text-mute">
        <Link to="/operations-center" className="hover:text-text">
          Operations Center
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-text">{agent.name}</span>
      </nav>

      <PageHeader
        icon={Icon}
        eyebrow={`Model · ${agent.model}`}
        title={agent.name}
        description={agent.description}
        actions={
          <>
            <Button variant="ghost" asChild>
              <Link to="/operations-center">
                <ArrowLeft className="h-4 w-4" /> Back
              </Link>
            </Button>
            <Button
              variant="teal"
              onClick={() => run.mutate()}
              disabled={run.isPending || !projectId}
            >
              <Play className="h-4 w-4" />
              {run.isPending ? 'Running…' : 'Run agent'}
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Inputs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {agent.inputs.map((i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-md border border-border bg-bg-elev-2/60 px-2.5 py-2"
              >
                <span
                  className={cn(
                    'mt-1 h-1.5 w-1.5 shrink-0 rounded-full',
                    agent.accent === 'magenta' && 'bg-magenta',
                    agent.accent === 'purple' && 'bg-purple',
                    agent.accent === 'teal' && 'bg-teal',
                    agent.accent === 'blue' && 'bg-info',
                  )}
                />
                <p className="text-sm text-text">{i}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Outputs</CardTitle>
            <p className="text-2xs text-mute">What the agent produces on every run</p>
          </CardHeader>
          <CardContent className="grid gap-2 md:grid-cols-2">
            {agent.outputs.map((o) => (
              <div
                key={o}
                className="rounded-md border border-border bg-bg-elev/60 p-3 text-sm text-text"
              >
                {o}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Run console</CardTitle>
            <p className="text-2xs text-mute">
              Pick a project and (optionally) add free-form instructions. Wired to the{' '}
              <code className="font-mono text-teal-soft">{agent.edgeFn}</code> Edge Function.
            </p>
          </div>
          <Badge tone="warning">No real key yet · set ANTHROPIC_API_KEY in Supabase secrets</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <label className="md:col-span-1 space-y-1.5">
              <span className="text-2xs font-medium uppercase tracking-wider text-mute">
                Project
              </span>
              <select
                className="ring-focus h-9 w-full rounded-md border border-border bg-bg-elev-2 px-2 text-sm text-text"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              >
                {seedProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} · {p.client}
                  </option>
                ))}
              </select>
            </label>
            <label className="md:col-span-2 space-y-1.5">
              <span className="text-2xs font-medium uppercase tracking-wider text-mute">
                Extra instructions (optional)
              </span>
              <Input
                placeholder="e.g. prioritize Polish suppliers; cap budget at 90% of objetivo"
                value={extraPrompt}
                onChange={(e) => setExtraPrompt(e.target.value)}
              />
            </label>
          </div>

          {run.isError && (
            <div className="rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
              {(run.error as Error)?.message ?? 'Agent run failed'}
            </div>
          )}

          <div className="rounded-md border border-border bg-bg-elev-2/60 p-4">
            <p className="mb-2 text-2xs font-medium uppercase tracking-wider text-mute">
              Response
            </p>
            {run.isPending ? (
              <div className="flex items-center gap-2 text-sm text-mute">
                <div className="h-2 w-2 animate-pulse-soft rounded-full bg-teal" />
                Calling Claude {agent.model}…
              </div>
            ) : run.data ? (
              <pre className="overflow-auto rounded-md bg-bg-elev/80 p-3 font-mono text-2xs text-text">
                {JSON.stringify(run.data, null, 2)}
              </pre>
            ) : (
              <p className="text-sm text-faint">
                No run yet. Press <span className="text-text">Run agent</span> to invoke the Edge
                Function.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
