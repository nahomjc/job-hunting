import type { Job } from "@/lib/db/schema";

const TECH_KEYWORDS = [
  "react",
  "next.js",
  "nextjs",
  "vue",
  "angular",
  "svelte",
  "node",
  "nodejs",
  "typescript",
  "javascript",
  "python",
  "django",
  "flask",
  "fastapi",
  "java",
  "spring",
  "kotlin",
  "go",
  "golang",
  "rust",
  "c++",
  "c#",
  ".net",
  "ruby",
  "rails",
  "php",
  "laravel",
  "swift",
  "ios",
  "android",
  "flutter",
  "dart",
  "aws",
  "azure",
  "gcp",
  "kubernetes",
  "docker",
  "devops",
  "sql",
  "postgres",
  "postgresql",
  "mongodb",
  "graphql",
  "redis",
  "terraform",
  "machine learning",
  "data science",
  "pandas",
  "tensorflow",
  "pytorch",
  "figma",
  "ui design",
  "product management",
  "sales",
  "marketing",
  "customer success",
  "accounting",
  "finance",
  "hr",
  "recruiting",
];

const TITLE_NOISE =
  /\b(senior|junior|mid|lead|staff|principal|associate|intern|remote|hybrid|onsite|full[- ]?time|part[- ]?time|contract|freelance|engineer|developer|dev|manager|specialist|analyst|consultant|architect|designer|the|and|or|for|with|at|in|a|an|ii|iii|iv|v)\b/gi;

export function extractJobInterviewTopics(job: Job, profileSkills?: string[]): string[] {
  const haystack = [
    job.title,
    (job.tags ?? []).join(" "),
    job.description?.slice(0, 2500) ?? "",
    (profileSkills ?? []).join(" "),
  ]
    .join(" ")
    .toLowerCase();

  const found = new Set<string>();

  for (const kw of TECH_KEYWORDS) {
    if (haystack.includes(kw.toLowerCase())) {
      found.add(kw);
    }
  }

  if (found.size === 0) {
    const titleTokens = job.title
      .replace(TITLE_NOISE, " ")
      .split(/[\s,/|&+]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 2);

    for (const token of titleTokens.slice(0, 2)) {
      found.add(token);
    }
  }

  return [...found].slice(0, 3);
}

export function stageInterviewLabel(stage: string): string {
  switch (stage) {
    case "phone_screen":
      return "phone screen interview";
    case "technical":
      return "technical interview";
    case "behavioral":
      return "behavioral interview";
    case "onsite":
      return "onsite interview";
    case "final":
      return "final round interview";
    default:
      return "job interview";
  }
}

export function buildInterviewVideoSearchQueries(
  job: Job,
  stage: string,
  profileSkills?: string[]
): string[] {
  const topics = extractJobInterviewTopics(job, profileSkills);
  const stageLabel = stageInterviewLabel(stage);
  const queries: string[] = [`${stageLabel} tips`];

  if (stage === "behavioral") {
    queries.push("STAR method behavioral interview examples");
  }

  for (const topic of topics) {
    queries.push(`${topic} interview questions`);
    if (stage === "technical") {
      queries.push(`${topic} technical interview`);
    }
  }

  if (topics.length === 0) {
    queries.push(`${job.title} interview preparation`);
  }

  return [...new Set(queries)].slice(0, 5);
}

export function youtubeSearchUrl(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}
