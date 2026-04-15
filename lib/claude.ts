import Anthropic from "@anthropic-ai/sdk";
import type { Capability } from "./types";
import { ALL_CAPABILITIES } from "./types";

let clientInstance: Anthropic | null = null;

function getClient(): Anthropic {
  if (!clientInstance) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }
    clientInstance = new Anthropic({ apiKey });
  }
  return clientInstance;
}

export interface CapabilityExtractionResult {
  capabilities: Capability[];
  reasoning: string;
}

export async function extractCapabilities(
  taskDescription: string
): Promise<CapabilityExtractionResult> {
  const client = getClient();

  const capDescriptions: Record<Capability, string> = {
    web_search:         "searching the internet, researching online topics, finding URLs",
    code_execution:     "running code, executing scripts, computations",
    text_generation:    "writing prose, drafting documents, generating natural language output",
    data_analysis:      "analyzing datasets, statistics, CSV/JSON, charts",
    file_operations:    "reading/writing files, format conversion, storage",
    api_calls:          "calling external APIs, HTTP requests, integrations",
    summarization:      "condensing long text, creating summaries, TL;DR",
    translation:        "translating between languages",
    reasoning:          "logical deduction, multi-step thinking, inference",
    planning:           "project planning, roadmaps, sequencing steps",
    task_decomposition: "breaking large tasks into subtasks, work breakdown structures",
    code_generation:    "writing new code, implementing features, generating programs",
    code_review:        "reviewing code quality, finding bugs, suggesting improvements",
    debugging:          "diagnosing errors, fixing bugs, tracing issues",
    security_analysis:  "finding vulnerabilities, auditing code/systems for security issues",
    data_extraction:    "scraping, parsing, extracting structured data from unstructured sources",
    monitoring:         "tracking metrics, observability, uptime checks, health checks",
    alerting:           "generating alerts, notifications, anomaly detection",
    knowledge_retrieval:"retrieving facts, looking up information from knowledge bases",
  };

  const capList = ALL_CAPABILITIES
    .map((c) => `- ${c}: ${capDescriptions[c]}`)
    .join("\n");

  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `You are a capability router for a multi-agent system. Identify ALL capabilities needed to complete this task.

Available capabilities:
${capList}

Task: "${taskDescription}"

Instructions:
- Select MULTIPLE capabilities if the task requires different types of work
- Be specific — "summarization" is different from "text_generation"
- "code_review" + "debugging" + "security_analysis" are separate from "code_generation"
- Minimum 2 capabilities for complex tasks

Respond with ONLY valid JSON, no markdown:
{"capabilities": ["cap1", "cap2", "cap3"], "reasoning": "brief explanation"}`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    return { capabilities: ["text_generation"], reasoning: "Fallback" };
  }

  try {
    const parsed = JSON.parse(content.text.trim()) as {
      capabilities: string[];
      reasoning: string;
    };
    const validCaps = parsed.capabilities.filter((c): c is Capability =>
      ALL_CAPABILITIES.includes(c as Capability)
    );
    return {
      capabilities: validCaps.length > 0 ? validCaps : ["text_generation"],
      reasoning: parsed.reasoning || "",
    };
  } catch {
    return { capabilities: ["text_generation"], reasoning: "Failed to parse response" };
  }
}

export async function executeTask(
  taskDescription: string,
  capabilities: Capability[],
  searchResults?: string
): Promise<string> {
  const client = getClient();

  const contextParts: string[] = [];
  if (searchResults) {
    contextParts.push(`Web search results:\n${searchResults}`);
  }

  const systemPrompt = `You are a specialized AI agent in the Mycelium network with capabilities: ${capabilities.join(", ")}.
Complete the assigned task concisely and accurately. Return results in a structured format.
Do not explain what you're doing — just do it and return the result.`;

  const userMessage = contextParts.length > 0
    ? `Task: ${taskDescription}\n\nContext:\n${contextParts.join("\n\n")}`
    : `Task: ${taskDescription}`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const content = response.content[0];
  return content.type === "text" ? content.text : "Task execution produced no output.";
}
