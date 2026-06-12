import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  real,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const remotePreferenceEnum = pgEnum("remote_preference", [
  "remote",
  "hybrid",
  "onsite",
  "any",
]);

export const applicationStatusEnum = pgEnum("application_status", [
  "discovered",
  "saved",
  "applied",
  "recruiter_contacted",
  "interview_scheduled",
  "offer_received",
  "rejected",
]);

export const interviewStageEnum = pgEnum("interview_stage", [
  "phone_screen",
  "technical",
  "behavioral",
  "onsite",
  "final",
  "other",
]);

export const notificationChannelEnum = pgEnum("notification_channel", [
  "email",
  "telegram",
  "in_app",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "high_match_job",
  "recruiter_response",
  "interview_scheduled",
  "weekly_report",
  "system",
]);

export const agentTypeEnum = pgEnum("agent_type", [
  "manager",
  "job_hunter",
  "job_match",
  "resume",
  "cover_letter",
  "outreach",
  "interview",
]);

export const agentStatusEnum = pgEnum("agent_status", [
  "pending",
  "running",
  "completed",
  "failed",
]);

export const jobProviderEnum = pgEnum("job_provider", [
  "remoteok",
  "wellfound",
  "greenhouse",
  "lever",
  "career_page",
  "manual",
]);

// ─── Users (synced from Supabase Auth) ───────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Profiles ────────────────────────────────────────────────────────────────

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  fullName: text("full_name"),
  skills: jsonb("skills").$type<string[]>().default([]),
  yearsOfExperience: integer("years_of_experience"),
  preferredSalaryMin: integer("preferred_salary_min"),
  preferredSalaryMax: integer("preferred_salary_max"),
  preferredLocations: jsonb("preferred_locations").$type<string[]>().default([]),
  remotePreference: remotePreferenceEnum("remote_preference").default("any"),
  linkedinUrl: text("linkedin_url"),
  githubUrl: text("github_url"),
  portfolioUrl: text("portfolio_url"),
  resumeText: text("resume_text"),
  preferences: jsonb("preferences").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Jobs ────────────────────────────────────────────────────────────────────

export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    externalId: text("external_id"),
    provider: jobProviderEnum("provider").notNull(),
    company: text("company").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    url: text("url").notNull(),
    salaryMin: integer("salary_min"),
    salaryMax: integer("salary_max"),
    salaryCurrency: text("salary_currency").default("USD"),
    location: text("location"),
    isRemote: boolean("is_remote").default(false),
    tags: jsonb("tags").$type<string[]>().default([]),
    rawData: jsonb("raw_data").$type<Record<string, unknown>>(),
    postedAt: timestamp("posted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("jobs_provider_external_id_idx").on(t.provider, t.externalId),
    index("jobs_company_idx").on(t.company),
  ]
);

// ─── Resumes ─────────────────────────────────────────────────────────────────

export const resumes = pgTable(
  "resumes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    jobId: uuid("job_id").references(() => jobs.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    content: text("content").notNull(),
    isDefault: boolean("is_default").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("resumes_user_id_idx").on(t.userId)]
);

// ─── Job Matches ─────────────────────────────────────────────────────────────

export const jobMatches = pgTable(
  "job_matches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    score: real("score").notNull(),
    reasons: jsonb("reasons").$type<string[]>().default([]),
    explanation: text("explanation"),
    scoredAt: timestamp("scored_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("job_matches_user_job_idx").on(t.userId, t.jobId),
    index("job_matches_score_idx").on(t.score),
  ]
);

// ─── Applications ────────────────────────────────────────────────────────────

export const applications = pgTable(
  "applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    jobMatchId: uuid("job_match_id").references(() => jobMatches.id, {
      onDelete: "set null",
    }),
    status: applicationStatusEnum("status").default("discovered").notNull(),
    coverLetter: text("cover_letter"),
    outreachEmail: text("outreach_email"),
    outreachLinkedin: text("outreach_linkedin"),
    followUpMessage: text("follow_up_message"),
    notes: text("notes"),
    appliedAt: timestamp("applied_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("applications_user_job_idx").on(t.userId, t.jobId),
    index("applications_status_idx").on(t.status),
  ]
);

// ─── Interviews ────────────────────────────────────────────────────────────────

export const interviews = pgTable(
  "interviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    stage: interviewStageEnum("stage").default("other").notNull(),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    prepNotes: text("prep_notes"),
    likelyQuestions: jsonb("likely_questions").$type<string[]>().default([]),
    feedback: text("feedback"),
    completed: boolean("completed").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("interviews_user_id_idx").on(t.userId)]
);

// ─── Notifications ───────────────────────────────────────────────────────────

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    channel: notificationChannelEnum("channel").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    read: boolean("read").default(false),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("notifications_user_id_idx").on(t.userId)]
);

// ─── Notification Settings ───────────────────────────────────────────────────

export const notificationSettings = pgTable("notification_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  emailEnabled: boolean("email_enabled").default(true),
  telegramEnabled: boolean("telegram_enabled").default(false),
  telegramChatId: text("telegram_chat_id"),
  highMatchThreshold: integer("high_match_threshold").default(80),
  notifyHighMatch: boolean("notify_high_match").default(true),
  notifyRecruiterResponse: boolean("notify_recruiter_response").default(true),
  notifyInterviewScheduled: boolean("notify_interview_scheduled").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Agent Executions ────────────────────────────────────────────────────────

export const agentExecutions = pgTable(
  "agent_executions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    agentType: agentTypeEnum("agent_type").notNull(),
    status: agentStatusEnum("status").default("pending").notNull(),
    input: jsonb("input").$type<Record<string, unknown>>(),
    output: jsonb("output").$type<Record<string, unknown>>(),
    error: text("error"),
    durationMs: integer("duration_ms"),
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [index("agent_executions_user_id_idx").on(t.userId)]
);

// ─── Prompt Templates ────────────────────────────────────────────────────────

export const promptTemplates = pgTable(
  "prompt_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: text("key").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    systemPrompt: text("system_prompt").notNull(),
    userPromptTemplate: text("user_prompt_template").notNull(),
    model: text("model"),
    version: integer("version").default(1),
    active: boolean("active").default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  }
);

// ─── Audit Logs ──────────────────────────────────────────────────────────────

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    resource: text("resource"),
    resourceId: text("resource_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("audit_logs_user_id_idx").on(t.userId)]
);

// ─── Relations ───────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, { fields: [users.id], references: [profiles.userId] }),
  resumes: many(resumes),
  jobMatches: many(jobMatches),
  applications: many(applications),
  interviews: many(interviews),
  notifications: many(notifications),
  notificationSettings: one(notificationSettings, {
    fields: [users.id],
    references: [notificationSettings.userId],
  }),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, { fields: [profiles.userId], references: [users.id] }),
}));

export const jobsRelations = relations(jobs, ({ many }) => ({
  matches: many(jobMatches),
  applications: many(applications),
}));

export const jobMatchesRelations = relations(jobMatches, ({ one }) => ({
  user: one(users, { fields: [jobMatches.userId], references: [users.id] }),
  job: one(jobs, { fields: [jobMatches.jobId], references: [jobs.id] }),
}));

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  user: one(users, { fields: [applications.userId], references: [users.id] }),
  job: one(jobs, { fields: [applications.jobId], references: [jobs.id] }),
  jobMatch: one(jobMatches, {
    fields: [applications.jobMatchId],
    references: [jobMatches.id],
  }),
  interviews: many(interviews),
}));

export const interviewsRelations = relations(interviews, ({ one }) => ({
  user: one(users, { fields: [interviews.userId], references: [users.id] }),
  application: one(applications, {
    fields: [interviews.applicationId],
    references: [applications.id],
  }),
}));

// ─── Types ───────────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type JobMatch = typeof jobMatches.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type Interview = typeof interviews.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Resume = typeof resumes.$inferSelect;
export type AgentExecution = typeof agentExecutions.$inferSelect;
export type PromptTemplate = typeof promptTemplates.$inferSelect;
