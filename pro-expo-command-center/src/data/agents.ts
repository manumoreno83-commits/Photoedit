import {
  Boxes,
  ClipboardCheck,
  Coins,
  FileSpreadsheet,
  Receipt,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

export type AgentId =
  | 'procurement'
  | 'technical-brief'
  | 'quick-costing'
  | 'quality-gate'
  | 'ce-reconciliation'
  | 'ops-orchestrator';

export interface AgentDef {
  id: AgentId;
  edgeFn:
    | 'agent-procurement'
    | 'agent-technical-brief'
    | 'agent-quick-costing'
    | 'agent-quality-gate'
    | 'agent-ce-reconciliation'
    | 'agent-ops-orchestrator';
  name: string;
  tagline: string;
  model: 'claude-sonnet-4-6' | 'claude-opus-4-7';
  icon: LucideIcon;
  accent: 'magenta' | 'purple' | 'teal' | 'blue';
  replaces: string;
  source: string;
  estimatedSavingHrYear: number;
  stability: 1 | 2 | 3 | 4 | 5;
  inputs: string[];
  outputs: string[];
  description: string;
}

export const AGENTS: AgentDef[] = [
  {
    id: 'procurement',
    edgeFn: 'agent-procurement',
    name: 'Procurement Agent',
    tagline: 'RFQ to 3+ suppliers, normalized & scored',
    model: 'claude-sonnet-4-6',
    icon: Boxes,
    accent: 'magenta',
    replaces: 'COMPARATIVA CARPINTEROS spreadsheet',
    source: 'Ops Manual §2.3 · Capacity Dashboard §5.2',
    estimatedSavingHrYear: 400,
    stability: 5,
    inputs: ['Project ID', 'BoQ / Memoria Constructiva', 'Target margin', 'Setup window'],
    outputs: [
      'Drafted RFQ emails per supplier',
      'Normalized comparative (PVP / Objetivo / quotes / delta)',
      'Capacity check vs Dashboard',
      'Polish-default recommendation when saving > 20%',
    ],
    description:
      'Replaces the COMPARATIVA Excel. Drafts RFQs to ≥ 3 Tier-1 builders, normalizes returns into the comparative grid, cross-checks against the Capacity Dashboard, and flags concentration risk.',
  },
  {
    id: 'technical-brief',
    edgeFn: 'agent-technical-brief',
    name: 'Technical Brief Agent',
    tagline: 'Day 1-2 brief assembled from venue + history',
    model: 'claude-sonnet-4-6',
    icon: FileSpreadsheet,
    accent: 'teal',
    replaces: 'Manual Technical Brief authoring',
    source: 'Ops Manual §2.2 · Design Protocol §6.3',
    estimatedSavingHrYear: 700,
    stability: 4,
    inputs: ['Exhibitor manual PDF', 'Venue / hall', 'Prior project references', 'PM notes'],
    outputs: [
      'Technical Brief draft (regs, rigging, electrical, logistics)',
      'Risk register pre-populated',
      'Prior-build lessons from CE history',
      '2-day SLA timer enforced',
    ],
    description:
      'Pulls venue regulations, floor-plan constraints, structural and rigging limits, plus the closest historical projects, into a ready-to-edit Technical Brief on Day 1 of the kick-off window.',
  },
  {
    id: 'quick-costing',
    edgeFn: 'agent-quick-costing',
    name: 'Quick Costing Agent',
    tagline: 'Pre-Costing Matrix + reuse credit + sanity check',
    model: 'claude-sonnet-4-6',
    icon: Coins,
    accent: 'purple',
    replaces: 'Quick Costing Excel template',
    source: 'Ops Manual §3.2–3.4',
    estimatedSavingHrYear: 500,
    stability: 4,
    inputs: ['Typology', 'sqm', 'AV intensity', 'Reuse candidates', 'Target margin'],
    outputs: [
      'EUR/sqm range vs typology baseline',
      'Markups applied (45/20/25/15 %)',
      'Reuse credit estimate',
      'Flag if > 15 % above Pre-Costing range',
    ],
    description:
      'Generates the pre-estimate envelope during the 4-day kick-off window, applies the standard markups, deducts reuse credit, and flags concepts that exceed the Pre-Costing Matrix range.',
  },
  {
    id: 'quality-gate',
    edgeFn: 'agent-quality-gate',
    name: 'Quality Gate Agent',
    tagline: 'Gates 1–4: state machine, GO / NO-GO to OD',
    model: 'claude-sonnet-4-6',
    icon: ClipboardCheck,
    accent: 'blue',
    replaces: 'Manual OD validation across 43 items × 4 gates',
    source: 'Ops Manual §6.1–6.5',
    estimatedSavingHrYear: 200,
    stability: 5,
    inputs: ['Project ID', 'Uploaded evidence (photos, docs)', 'Gate number'],
    outputs: [
      'Per-item status with rationale',
      'Missing-evidence list',
      'GO / NO-GO email draft to OD',
      'Auto-advance Odoo stage on GO',
    ],
    description:
      'Tracks the 43 checklist items across Pre-Production → Production → Setup → Close. Reads uploaded evidence, validates each item, and writes the GO / NO-GO email to the Ops Director.',
  },
  {
    id: 'ce-reconciliation',
    edgeFn: 'agent-ce-reconciliation',
    name: 'CE Reconciliation Agent',
    tagline: 'Invoices → CE auto-populated → real margin',
    model: 'claude-sonnet-4-6',
    icon: Receipt,
    accent: 'magenta',
    replaces: 'Manual CE_EVENT_YEAR_Client.xlsx fill-in',
    source: 'Ops Manual §6.5 · Margin learning loop',
    estimatedSavingHrYear: 300,
    stability: 4,
    inputs: ['Supplier invoices (PDF / email)', 'PLEO export', 'BoQ baseline'],
    outputs: [
      'CE rows auto-categorized (Construction / AV / Logistics / Venue)',
      'Actual vs BoQ delta',
      'Final-margin report',
      'Feedback into Pre-Costing Matrix',
    ],
    description:
      'Ingests supplier invoices and PLEO charges (VAT excl.), reconciles against the BoQ, and feeds the actual-vs-estimate delta back into the Pre-Costing Matrix so the next quote starts smarter.',
  },
  {
    id: 'ops-orchestrator',
    edgeFn: 'agent-ops-orchestrator',
    name: 'Ops Orchestrator',
    tagline: 'Your daily brief · routes work to the other 5',
    model: 'claude-opus-4-7',
    icon: Sparkles,
    accent: 'teal',
    replaces: 'Ad-hoc daily planning across 8+ active projects',
    source: 'Cross-cutting',
    estimatedSavingHrYear: 250,
    stability: 5,
    inputs: ['All project states', 'Calendar', 'Pending gates', 'Inbox digest'],
    outputs: [
      'Morning brief (top 5 actions, blockers, escalations)',
      'Agent dispatch (which sub-agents to run, with payload)',
      'Borderline 85-95K classification recommendation',
      'Weekly Ops Director digest',
    ],
    description:
      'Meta-agent running on Opus. Reads every project state each morning, decides which sub-agents to run, drafts your day, and surfaces only the decisions that require your attention.',
  },
];

export const AGENTS_BY_ID = Object.fromEntries(AGENTS.map((a) => [a.id, a])) as Record<
  AgentId,
  AgentDef
>;
