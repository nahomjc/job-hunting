import { eq } from "drizzle-orm";
import { requireDb, promptTemplates } from "@/lib/db";
import { resolveModelForTask } from "@/lib/ai/models";
import { DEFAULT_PROMPTS, type PromptKey } from "./defaults";

export function interpolateTemplate(
  template: string,
  variables: Record<string, string | number | boolean>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = variables[key];
    return value !== undefined ? String(value) : "";
  });
}

export async function getPrompt(key: PromptKey) {
  const db = requireDb();
  const [dbPrompt] = await db
    .select()
    .from(promptTemplates)
    .where(eq(promptTemplates.key, key))
    .limit(1);

  if (dbPrompt?.active) {
    return {
      ...dbPrompt,
      model: resolveModelForTask(key, dbPrompt.model),
    };
  }

  const fallback = DEFAULT_PROMPTS[key];
  return {
    ...fallback,
    id: "default",
    model: resolveModelForTask(key, null),
    version: 1,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function seedPromptTemplates() {
  const db = requireDb();

  for (const prompt of Object.values(DEFAULT_PROMPTS)) {
    const key = prompt.key as PromptKey;
    await db
      .insert(promptTemplates)
      .values({
        key: prompt.key,
        name: prompt.name,
        description: prompt.description,
        systemPrompt: prompt.systemPrompt,
        userPromptTemplate: prompt.userPromptTemplate,
        model: resolveModelForTask(key, null),
      })
      .onConflictDoNothing();
  }
}
