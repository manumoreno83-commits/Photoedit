import { useRouterState } from '@tanstack/react-router';
import {
  Activity,
  CalendarDays,
  ChevronsRight,
  Clock,
  PanelRightClose,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useUI } from '@/store/ui';
import { Badge } from '@/components/ui/badge';

interface ActivityItem {
  who: string;
  what: string;
  when: string;
  tone?: 'teal' | 'magenta' | 'purple' | 'neutral';
}

const RECENT: ActivityItem[] = [
  { who: 'Procurement', what: 'RFQ pack drafted for ZTE MWC, 4 builders', when: '6m', tone: 'teal' },
  { who: 'Quality Gate', what: 'Gate 2 GO sent to OD on ZTE MWC', when: '34m', tone: 'magenta' },
  { who: 'Quick Costing', what: 'Bayer CPHI flagged, EUR/sqm 12% over typology', when: '2h', tone: 'purple' },
  { who: 'Sync · Drive', what: 'COMPARATIVA CARPINTEROS pulled, 2 new rows', when: '4h' },
  { who: 'Manuel', what: 'Approved Pandrol classification as Strategic', when: '1d' },
];

const PIN_AGENDA = [
  { time: '09:30', label: 'Monday coordination meeting' },
  { time: '11:00', label: 'Bose Q3 brief call' },
  { time: '15:00', label: 'OD review · Pandrol borderline' },
];

export function RightPanel() {
  const collapsed = useUI((s) => s.rightPanelCollapsed);
  const toggle = useUI((s) => s.toggleRightPanel);
  const { location } = useRouterState();

  if (collapsed) {
    return (
      <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-10 shrink-0 border-l border-border bg-bg-elev/60 lg:flex">
        <button
          type="button"
          onClick={toggle}
          aria-label="Expand right panel"
          className="ring-focus mx-auto mt-3 flex h-7 w-7 items-center justify-center rounded-md text-mute transition-colors hover:bg-bg-elev-2 hover:text-text"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </aside>
    );
  }

  // Context label is route-aware so the panel feels purposeful.
  const contextLabel =
    location.pathname.startsWith('/cockpit/')
      ? 'Project context'
      : location.pathname.startsWith('/operations-center')
        ? 'Agent activity'
        : location.pathname.startsWith('/knowledge')
          ? 'Knowledge updates'
          : 'Today';

  return (
    <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-[320px] shrink-0 flex-col border-l border-border bg-bg-elev/60 backdrop-blur-md lg:flex">
      <header className="flex h-12 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-teal" />
          <span className="font-mono text-2xs uppercase tracking-[0.18em] text-mute">
            {contextLabel}
          </span>
        </div>
        <button
          type="button"
          onClick={toggle}
          aria-label="Collapse right panel"
          className="ring-focus flex h-7 w-7 items-center justify-center rounded-md text-mute hover:bg-bg-elev-2 hover:text-text"
        >
          <PanelRightClose className="h-4 w-4" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        <section>
          <SectionTitle icon={CalendarDays}>Today, 13 May</SectionTitle>
          <ul className="space-y-2">
            {PIN_AGENDA.map((p) => (
              <li
                key={p.time + p.label}
                className="flex items-start gap-3 rounded-md border border-border bg-bg-elev/70 px-2.5 py-2 text-sm"
              >
                <span className="font-mono text-2xs text-teal-soft">{p.time}</span>
                <span className="text-text">{p.label}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <SectionTitle icon={Activity}>Recent activity</SectionTitle>
          <ul className="space-y-2.5">
            {RECENT.map((r, i) => (
              <li key={i} className="space-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  <Badge tone={r.tone ?? 'neutral'}>{r.who}</Badge>
                  <span className="font-mono text-2xs text-faint">
                    <Clock className="mr-0.5 inline-block h-2.5 w-2.5" />
                    {r.when}
                  </span>
                </div>
                <p className="text-2xs leading-relaxed text-mute">{r.what}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <footer className="border-t border-border p-3 text-2xs text-faint">
        <p className={cn('font-mono uppercase tracking-wider')}>Pro Expo Operations Center · v0.1</p>
      </footer>
    </aside>
  );
}

function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: typeof Activity;
  children: React.ReactNode;
}) {
  return (
    <h3 className="mb-2 flex items-center gap-1.5 font-mono text-2xs uppercase tracking-[0.18em] text-faint">
      <Icon className="h-3 w-3" />
      {children}
    </h3>
  );
}
