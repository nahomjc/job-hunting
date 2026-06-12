import { seedPromptTemplates } from "../lib/ai/prompts/prompt-service";

async function main() {
  console.log("Seeding prompt templates...");
  await seedPromptTemplates();
  console.log("Done.");
}

main().catch(console.error);
