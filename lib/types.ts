export type Capability =
  | "web_search"
  | "code_execution"
  | "text_generation"
  | "data_analysis"
  | "file_operations"
  | "api_calls"
  | "summarization"
  | "translation"
  | "reasoning"
  | "planning"
  | "task_decomposition"
  | "code_generation"
  | "code_review"
  | "debugging"
  | "security_analysis"
  | "data_extraction"
  | "monitoring"
  | "alerting"
  | "knowledge_retrieval";

export const ALL_CAPABILITIES: Capability[] = [
  "web_search",
  "code_execution",
  "text_generation",
  "data_analysis",
  "file_operations",
  "api_calls",
  // extended capabilities
  "summarization",
  "translation",
  "reasoning",
  "planning",
  "task_decomposition",
  "code_generation",
  "code_review",
  "debugging",
  "security_analysis",
  "data_extraction",
  "monitoring",
  "alerting",
  "knowledge_retrieval",
];

export interface AgentRecord {
  id: string;
  name: string;
  capabilities: Capability[];
  createdAt: string;
  taskCount: number;
}

export interface TaskRecord {
  id: string;
  description: string;
  requiredCaps: Capability[];
  status: TaskStatus;
  result: string | null;
  createdAt: string;
  completedAt: string | null;
  coalitionId: string | null;
}

export interface CoalitionRecord {
  id: string;
  taskId: string;
  status: CoalitionStatus;
  createdAt: string;
  dissolvedAt: string | null;
  agents: AgentRecord[];
  task: TaskRecord;
}

export type TaskStatus = "PENDING" | "MATCHING" | "EXECUTING" | "COMPLETED" | "FAILED";
export type CoalitionStatus = "FORMING" | "ACTIVE" | "DISSOLVED";

export interface NetworkNode {
  id: string;
  name: string;
  capabilities: Capability[];
  taskCount: number;
  activeCoalition: string | null;
}

export interface NetworkEdge {
  source: string;
  target: string;
  coalitionId: string;
  status: CoalitionStatus;
}

export interface NetworkGraph {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

export interface StatsPayload {
  agentsTotal: number;
  coalitionsToday: number;
  tasksCompleted: number;
  activeCoalitions: number;
}

export interface MatchResult {
  coalition: AgentRecord[];
  requiredCapabilities: Capability[];
  confidence: number;
  reasoning: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  code?: string;
}

export interface RegisterAgentRequest {
  name: string;
  capabilities: Capability[];
}

export interface BroadcastTaskRequest {
  description: string;
}
