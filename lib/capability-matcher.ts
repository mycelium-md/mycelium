import { extractCapabilities } from "./claude";
import type { AgentRecord, Capability, MatchResult } from "./types";

/**
 * Greedy set cover: select the minimum set of agents that covers all required capabilities.
 * O(n * k) where n = agents, k = required capabilities.
 */
function greedySetCover(
  required: Set<Capability>,
  agents: AgentRecord[]
): AgentRecord[] {
  const covered = new Set<Capability>();
  const selected: AgentRecord[] = [];
  const remaining = new Set(agents);

  while (covered.size < required.size && remaining.size > 0) {
    let bestAgent: AgentRecord | null = null;
    let bestScore = -1;

    for (const agent of remaining) {
      const newlyCovered = agent.capabilities.filter(
        (c) => required.has(c) && !covered.has(c)
      ).length;
      if (newlyCovered > bestScore) {
        bestScore = newlyCovered;
        bestAgent = agent;
      }
    }

    if (!bestAgent || bestScore === 0) break;

    selected.push(bestAgent);
    remaining.delete(bestAgent);
    for (const cap of bestAgent.capabilities) {
      if (required.has(cap)) covered.add(cap);
    }
  }

  return selected;
}

/**
 * Score an agent against the required capabilities.
 * Returns a value between 0 and 1.
 */
function scoreAgent(agent: AgentRecord, required: Capability[]): number {
  if (required.length === 0) return 0;
  const matches = agent.capabilities.filter((c) => required.includes(c)).length;
  return matches / required.length;
}

/**
 * Main capability matcher.
 * 1. Uses Claude haiku to extract required capabilities from the task description.
 * 2. Scores each available agent.
 * 3. Runs greedy set cover to find the minimum viable coalition.
 * 4. Returns coalition + confidence score.
 */
export async function matchAgentsToTask(
  taskDescription: string,
  availableAgents: AgentRecord[]
): Promise<MatchResult> {
  if (availableAgents.length === 0) {
    return {
      coalition: [],
      requiredCapabilities: [],
      confidence: 0,
      reasoning: "No agents registered in the network.",
    };
  }

  // Step 1: Extract capabilities via Claude
  const { capabilities: requiredCaps, reasoning } = await extractCapabilities(taskDescription);

  // Step 2: Score agents
  const scoredAgents = availableAgents
    .map((agent) => ({
      agent,
      score: scoreAgent(agent, requiredCaps),
    }))
    .sort((a, b) => b.score - a.score);

  const qualifiedAgents = scoredAgents
    .filter((a) => a.score > 0)
    .map((a) => a.agent);

  // If no agent has matching capabilities, use any agents with text_generation or best available
  const candidatePool =
    qualifiedAgents.length > 0
      ? qualifiedAgents
      : availableAgents.filter((a) => a.capabilities.includes("text_generation")).length > 0
      ? availableAgents.filter((a) => a.capabilities.includes("text_generation"))
      : availableAgents.slice(0, 1);

  // Step 3: Greedy set cover for minimum viable coalition
  const requiredSet = new Set<Capability>(requiredCaps);
  const coalition = greedySetCover(requiredSet, candidatePool);

  // If coalition is empty after set cover (edge case), pick the best scoring agent
  const finalCoalition = coalition.length > 0 ? coalition : candidatePool.slice(0, 1);

  // Step 4: Compute confidence
  const coveredCaps = new Set<Capability>();
  for (const agent of finalCoalition) {
    for (const cap of agent.capabilities) {
      if (requiredSet.has(cap)) coveredCaps.add(cap);
    }
  }
  const coverage =
    requiredCaps.length > 0 ? coveredCaps.size / requiredCaps.length : 1;

  return {
    coalition: finalCoalition,
    requiredCapabilities: requiredCaps,
    confidence: Math.round(coverage * 100) / 100,
    reasoning,
  };
}
