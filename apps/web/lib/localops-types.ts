export type Source = {
  id: string;
  filename: string;
  content?: string;
  status?: string;
  chunk_count?: number;
  created_at?: string;
};
export type Dataset = {
  id: string;
  filename: string;
  columns: string[];
  rows?: Record<string, unknown>[];
  row_count: number;
};
export type Citation = {
  document_id: string;
  filename: string;
  excerpt: string;
  page?: number;
  section?: string;
  score?: number;
  /** Internal position used to continue a document answer in browser-only mode. */
  chunk_index?: number;
};
export type Analysis = {
  columns: string[];
  rows: Record<string, unknown>[];
  query?: string;
  filename?: string;
  dataset_id?: string;
};
export type Approval = {
  id?: string;
  approval_id?: string;
  tool: string;
  payload?: Record<string, unknown>;
  status: string;
  created_at?: string;
  result?: Record<string, unknown>;
};
export type Answer = {
  answer: string;
  citations: Citation[];
  trajectory: string[];
  analytics?: Analysis | null;
  approval?: Approval | null;
  conversation_id: string;
  mode: string;
};
export type Message = {
  role: string;
  content: string;
  metadata?: Partial<Answer>;
};
export type Audit = {
  id: number;
  event: string;
  entity_id: string;
  created_at: string;
};
export type Snapshot = {
  documents: Source[];
  datasets: Dataset[];
  approvals: Approval[];
  tasks: { id: string; title: string; description: string }[];
  reports: { id: string; title: string; content?: string }[];
  activity: Audit[];
};
export type Health = {
  status: string;
  mode: string;
  version?: string;
  retrieval?: string;
  reranker?: boolean;
  voice?: { stt: boolean; tts: boolean };
  auth_required?: boolean;
};
