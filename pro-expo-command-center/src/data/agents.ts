import {
  Boxes,
  CalendarRange,
  ClipboardCheck,
  Coins,
  Filter,
  Leaf,
  Mail,
  PenLine,
  type LucideIcon,
} from 'lucide-react';

export type AgentId =
  | 'client-communicator'
  | 'rfp-triage'
  | 'rfp-brief-response'
  | 'procurement'
  | 'supplier-decision'
  | 'project-plan-builder'
  | 'quick-costing'
  | 'quality-gate'
  | 'sustainability-audit';

export type EdgeFn =
  | 'agent-client-communicator'
  | 'agent-rfp-triage'
  | 'agent-rfp-brief-response'
  | 'agent-procurement'
  | 'agent-supplier-decision'
  | 'agent-project-plan-builder'
  | 'agent-quick-costing'
  | 'agent-quality-gate'
  | 'agent-sustainability-audit';

export interface AgentDef {
  id: AgentId;
  edgeFn: EdgeFn;
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
  status: 'live' | 'planned';
}

// 3x3 grid order, top-left to bottom-right.
export const AGENTS: AgentDef[] = [
  // Row 1
  {
    id: 'client-communicator',
    edgeFn: 'agent-client-communicator',
    name: 'Client Communicator',
    tagline: 'Drafts in Pro Expo Voice, matched to client tone',
    model: 'claude-sonnet-4-6',
    icon: Mail,
    accent: 'magenta',
    replaces: 'Manual email drafting in Gmail',
    source: 'Brief §6 · Pro Expo Voice doc',
    estimatedSavingHrYear: 350,
    stability: 4,
    inputs: ['Situation context', 'Client + typology', 'Intent (status, change, escalation, decline)'],
    outputs: [
      'Email draft in Pro Expo Voice',
      'Tone matched to client typology',
      'Optionally pushed to Gmail Drafts',
      'Recommendation: send / hold / escalate',
    ],
    description:
      'Drafts client emails in Pro Expo Voice. No filler, no leverage/seamless/synergies, no em dashes. Matches register to client typology (corporate vs disruptive). Pushes to Gmail Drafts when wired.',
    status: 'planned',
  },
  {
    id: 'rfp-triage',
    edgeFn: 'agent-rfp-triage',
    name: 'RFP Triage',
    tagline: 'Whale / Tuna / Salmon / Fish Tank / Sardine, in 30 seconds',
    model: 'claude-opus-4-7',
    icon: Filter,
    accent: 'magenta',
    replaces: 'Ad-hoc qualification of incoming RFPs',
    source: 'Brief §1 · Workshop Tiering · Pre-Costing Matrix',
    estimatedSavingHrYear: 400,
    stability: 5,
    inputs: ['Forwarded email', 'PDF brief', 'Pasted text'],
    outputs: [
      'Structured extract (budget, sqm, venue, deadline, client, vertical)',
      'Tier classification with rationale',
      'Bid effort recommendation: Hard / Light / Pass',
      'Risk flags (incomplete brief, wrong contact seniority, logistics, competitive)',
    ],
    description:
      'Reads any incoming RFP. Pulls structured data, applies the Whale / Tuna / Salmon / Fish Tank / Sardine tiering, runs a budget realism check against the Pre-Costing Matrix, and tells you whether to bid hard, light, or pass.',
    status: 'planned',
  },
  {
    id: 'rfp-brief-response',
    edgeFn: 'agent-rfp-brief-response',
    name: 'RFP Brief Response',
    tagline: 'Client-facing proposal drafted from brief + case studies',
    model: 'claude-sonnet-4-6',
    icon: PenLine,
    accent: 'purple',
    replaces: 'Manual proposal authoring',
    source: 'Brief §2 · Pro Expo Voice · Knowledge Base case studies',
    estimatedSavingHrYear: 600,
    stability: 4,
    inputs: ['Project brief', 'Client profile', 'Scope of work'],
    outputs: [
      'Proposal draft in Pro Expo Voice (Markdown)',
      '2 to 3 case studies pulled from prior projects matching the vertical',
      'Concrete sqm + event references',
      'Optional .docx export',
    ],
    description:
      'Drafts the client-facing proposal in Pro Expo Voice. Short sentences, exact numbers, no corporate filler. Always cites 2 to 3 past projects with sqm and event from the Knowledge Base.',
    status: 'planned',
  },

  // Row 2
  {
    id: 'procurement',
    edgeFn: 'agent-procurement',
    name: 'Procurement',
    tagline: 'RFQ pack to 3+ builders, normalized into Comparativa',
    model: 'claude-sonnet-4-6',
    icon: Boxes,
    accent: 'teal',
    replaces: 'COMPARATIVA CARPINTEROS Excel',
    source: 'Ops Manual §2.3 · Capacity Dashboard §5.2',
    estimatedSavingHrYear: 400,
    stability: 5,
    inputs: ['Project ID', 'BoQ / Memoria Constructiva', 'Target margin', 'Setup window'],
    outputs: [
      'Drafted RFQ emails per supplier',
      'Normalized comparative grid (PVP, Objetivo, quotes, delta)',
      'Capacity check vs Dashboard',
      'Polish-default flag when saving exceeds 20%',
    ],
    description:
      'Generates the full RFQ pack. Drafts the email per supplier, normalizes returns into the Comparativa grid, cross-checks the Capacity Dashboard, and flags concentration risk.',
    status: 'live',
  },
  {
    id: 'supplier-decision',
    edgeFn: 'agent-supplier-decision',
    name: 'Supplier Decision',
    tagline: 'Pick 3 from your shortlist, with rationale + savings',
    model: 'claude-sonnet-4-6',
    icon: Boxes,
    accent: 'teal',
    replaces: 'Gut call across COMPARATIVA + WhatsApp',
    source: 'Brief §3 · Tier framework · Capacity Dashboard',
    estimatedSavingHrYear: 200,
    stability: 4,
    inputs: ['Project profile (sqm, venue, AV intensity, timeline, scope)'],
    outputs: [
      'Top 3 suppliers ranked',
      'Savings estimate vs alternatives',
      'Geographic logistics check (Poland-first when saving exceeds 20%)',
      'Recommendation: lock supplier X for Y reason',
    ],
    description:
      'Decisive recommendation among shortlisted suppliers. Applies the Tier framework (Tier 1: Gualoga, Reflex, One Group, Plus Expo, Idea Expo, CBS, Backwood. Tier 2: Hendcraft, Mat Expo, Team Brazil). Factors live capacity and geographic fit.',
    status: 'planned',
  },
  {
    id: 'project-plan-builder',
    edgeFn: 'agent-project-plan-builder',
    name: 'Project Plan Builder',
    tagline: 'Full schedule + Calendar events from kickoff to delivery',
    model: 'claude-opus-4-7',
    icon: CalendarRange,
    accent: 'blue',
    replaces: 'Manual project planning + calendar invites',
    source: 'Brief §5 · PM Protocol Quality Gates',
    estimatedSavingHrYear: 250,
    stability: 4,
    inputs: ['Confirmed project', 'Event date', 'Scope of work'],
    outputs: [
      'Full timeline mapped to Quality Gates 1 to 4',
      'Per-phase milestones with owners',
      'Google Calendar events created',
      'Critical path flagged',
    ],
    description:
      'Builds the project schedule end to end. Maps every milestone to the PM Protocol Quality Gates, names owners, and creates the Calendar events via Google Calendar API.',
    status: 'planned',
  },

  // Row 3
  {
    id: 'quick-costing',
    edgeFn: 'agent-quick-costing',
    name: 'Quick Costing',
    tagline: 'Pre-Costing Matrix + reuse credit + sanity check',
    model: 'claude-sonnet-4-6',
    icon: Coins,
    accent: 'purple',
    replaces: 'Quick Costing Excel template',
    source: 'Ops Manual §3.2 to §3.4',
    estimatedSavingHrYear: 500,
    stability: 4,
    inputs: ['Typology', 'sqm', 'AV intensity', 'Reuse candidates', 'Target margin'],
    outputs: [
      'EUR per sqm range vs typology baseline',
      'Markups applied (45 / 20 / 25 / 15 %)',
      'Reuse credit estimate',
      'Flag if more than 15% above Pre-Costing range',
    ],
    description:
      'Generates the pre-estimate envelope during the 4-day kick-off window. Applies standard markups, deducts reuse credit, and flags concepts that exceed the Pre-Costing Matrix range.',
    status: 'live',
  },
  {
    id: 'quality-gate',
    edgeFn: 'agent-quality-gate',
    name: 'Quality Gate',
    tagline: '43 checklist items, 4 gates, GO / NO-GO email to OD',
    model: 'claude-sonnet-4-6',
    icon: ClipboardCheck,
    accent: 'blue',
    replaces: 'Manual OD validation across 43 items × 4 gates',
    source: 'Ops Manual §6.1 to §6.5',
    estimatedSavingHrYear: 200,
    stability: 5,
    inputs: ['Project ID', 'Uploaded evidence (photos, docs)', 'Gate number'],
    outputs: [
      'Per-item status with rationale',
      'Missing-evidence list',
      'GO / NO-GO email draft to Operations Director',
      'Auto-advance Odoo stage on GO',
    ],
    description:
      'Walks the 43 checklist items across Pre-Production, Production, Setup, Close. Reads uploaded evidence, validates each item, and drafts the GO / NO-GO email.',
    status: 'live',
  },
  {
    id: 'sustainability-audit',
    edgeFn: 'agent-sustainability-audit',
    name: 'Sustainability Audit',
    tagline: 'EcoVadis Bronze + Better Stands Gold scoring',
    model: 'claude-sonnet-4-6',
    icon: Leaf,
    accent: 'teal',
    replaces: 'Ad-hoc sustainability sign-off',
    source: 'Brief §4 · Sustainability rubric (DRAFT, Irazu)',
    estimatedSavingHrYear: 150,
    stability: 4,
    inputs: ['Design file or production sheet', 'BoQ'],
    outputs: [
      'Score 0 to 100 + tier (None / Bronze / Gold)',
      'Reusable material % calculated',
      'Single-use material flags',
      'Top 3 swap recommendations with EUR delta',
      'Slack post to #sustainability with Irazu as owner',
    ],
    description:
      'Audits a design against the Sustainability rubric (90% reusable target, modular preference, single-use blocks). Outputs a Bronze / Gold score and concrete swap recommendations sized in EUR.',
    status: 'planned',
  },
];

export const AGENTS_BY_ID = Object.fromEntries(AGENTS.map((a) => [a.id, a])) as Record<
  AgentId,
  AgentDef
>;

export function isLiveAgent(a: AgentDef): boolean {
  return a.status === 'live';
}
