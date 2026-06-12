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

export async function chatJson<T>(options: ChatOptions): Promise<T> {
  const content = await chat({ ...options, jsonMode: true });
  return JSON.parse(content) as T;
}
