import Anthropic from "@anthropic-ai/sdk";
import type { Capability } from "./types";

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

const ALL_CAPS: Capability[] = [
  "web_search",
  "code_execution",
  "text_generation",
  "data_analysis",
  "file_operations",
  "api_calls",
];

export async function extractCapabilities(
  taskDescription: string
): Promise<CapabilityExtractionResult> {
  const client = getClient();

  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `Extract the required agent capabilities from this task description.

Available capabilities:
- web_search: searching the internet, finding URLs, researching topics online
- code_execution: running code, scripts, computations, algorithms
- text_generation: writing text, summarization, translation, drafting content
- data_analysis: analyzing datasets, statistics, CSV/JSON processing, visualization
- file_operations: reading/writing files, file format conversion, storage
- api_calls: calling external APIs, web services, HTTP requests, integrations

Task: "${taskDescription}"

Respond with ONLY a valid JSON object, no markdown, no explanation:
{"capabilities": ["capability1", "capability2"], "reasoning": "brief explanation"}

Only include capabilities that are actually needed. At minimum include "text_generation".`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    return { capabilities: ["text_generation"], reasoning: "Fallback to text generation" };
  }

  try {
    const parsed = JSON.parse(content.text.trim()) as {
      capabilities: string[];
      reasoning: string;
    };
    const validCaps = parsed.capabilities.filter((c): c is Capability =>
      ALL_CAPS.includes(c as Capability)
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
