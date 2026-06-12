import OpenAI from "openai";
import { QUALITY_MODEL } from "./models";
import { logAiUsage } from "@/lib/services/ai-usage-service";
import type { AgentType } from "@/lib/ai/agents/base-agent";

const DEFAULT_MODEL = QUALITY_MODEL;

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is not configured");
    }
    client = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey,
      defaultHeaders: {
        "HTTP-Referer":
          process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
        "X-Title": "JobHunter AI",
      },
    });
  }
  return client;
}

export interface ChatOptions {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  userId?: string;
  agentType?: AgentType;
}

export async function chat({
  systemPrompt,
  userPrompt,
  model = DEFAULT_MODEL,
  temperature = 0.3,
  maxTokens = 4096,
  jsonMode = false,
  userId,
  agentType,
}: ChatOptions): Promise<string> {
  const openai = getClient();

  const response = await openai.chat.completions.create({
    model,
    temperature,
    max_tokens: maxTokens,
    response_format: jsonMode ? { type: "json_object" } : undefined,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const usage = response.usage;
  if (usage) {
    void logAiUsage({
      userId,
      model,
      agentType,
      promptTokens: usage.prompt_tokens ?? 0,
      completionTokens: usage.completion_tokens ?? 0,
    });
  }

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from OpenRouter");
  }
  return content;
}

/** Models sometimes wrap JSON in ```json fences despite json_mode. */
export function parseModelJson<T>(content: string): T {
  let text = content.trim();

  const fullFence = text.match(/^```(?:json)?\s*([\s\S]*?)```\s*$/i);
  if (fullFence) {
    text = fullFence[1].trim();
  } else {
    const embedded = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (embedded) {
      text = embedded[1].trim();
    }
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    const objectStart = text.indexOf("{");
    const objectEnd = text.lastIndexOf("}");
    if (objectStart !== -1 && objectEnd > objectStart) {
      return JSON.parse(text.slice(objectStart, objectEnd + 1)) as T;
    }
    throw new Error(
      `Model returned invalid JSON. Preview: ${content.slice(0, 160).replace(/\s+/g, " ")}`
    );
  }
}

export async function chatJson<T>(options: ChatOptions): Promise<T> {
  const content = await chat({ ...options, jsonMode: true });
  return parseModelJson<T>(content);
}
