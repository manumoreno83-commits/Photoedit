// Supabase generated types live here once you run `supabase gen types typescript`.
// For now, hand-rolled minimal shape that matches the migration in supabase/migrations.

export type ProjectClassification = 'functional' | 'strategic' | 'borderline';
export type ProjectStage =
  | 'briefing'
  | 'design'
  | 'quotation'
  | 'delivered'
  | 'won'
  | 'lost'
  | 'production'
  | 'setup'
  | 'closed';
export type ClientTypology = 'experience_seeker' | 'brand_sensitive' | 'price_sensitive' | 'repeat';
export type SupplierTier = 1 | 2 | 3;
export type GateStatus = 'pending' | 'in_review' | 'go' | 'no_go';
export type AgentRunStatus = 'queued' | 'running' | 'succeeded' | 'failed';

export interface Project {
  id: string;
  code: string;
  client: string;
  event: string;
  venue: string | null;
  hall: string | null;
  stand_no: string | null;
  sqm: number;
  pvp_client: number | null;
  precio_objetivo: number | null;
  classification: ProjectClassification;
  client_typology: ClientTypology | null;
  stage: ProjectStage;
  pm_initials: string | null;
  creative_lead: string | null;
  event_date: string | null;
  setup_start: string | null;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  tier: SupplierTier;
  country: string | null;
  category: string;
  max_concurrent: number;
  active_projects: number;
  rating: number | null;
  notes: string | null;
}

export interface Rfq {
  id: string;
  project_id: string;
  supplier_id: string;
  status: 'pending' | 'received' | 'unavailable' | 'confirmed';
  amount: number | null;
  scope_note: string | null;
  requested_at: string;
  responded_at: string | null;
}

export interface QualityGate {
  id: string;
  project_id: string;
  gate_number: 1 | 2 | 3 | 4;
  status: GateStatus;
  checklist: Record<string, { done: boolean; note?: string }>;
  validated_by: string | null;
  validated_at: string | null;
}

export interface KnowledgeEntry {
  id: string;
  category: 'voice' | 'suppliers' | 'clients' | 'margins' | 'sustainability' | 'venues';
  title: string;
  body: string;
  tags: string[];
  updated_at: string;
}

export interface AgentRun {
  id: string;
  agent: string;
  project_id: string | null;
  status: AgentRunStatus;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  model: string;
  tokens_in: number | null;
  tokens_out: number | null;
  error: string | null;
  started_at: string;
  finished_at: string | null;
}

export interface Database {
  public: {
    Tables: {
      projects: { Row: Project; Insert: Partial<Project>; Update: Partial<Project> };
      suppliers: { Row: Supplier; Insert: Partial<Supplier>; Update: Partial<Supplier> };
      rfqs: { Row: Rfq; Insert: Partial<Rfq>; Update: Partial<Rfq> };
      quality_gates: {
        Row: QualityGate;
        Insert: Partial<QualityGate>;
        Update: Partial<QualityGate>;
      };
      knowledge_entries: {
        Row: KnowledgeEntry;
        Insert: Partial<KnowledgeEntry>;
        Update: Partial<KnowledgeEntry>;
      };
      agent_runs: { Row: AgentRun; Insert: Partial<AgentRun>; Update: Partial<AgentRun> };
    };
  };
}
