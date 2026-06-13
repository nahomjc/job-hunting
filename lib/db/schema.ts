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
  "remotive",
  "arbeitnow",
  "remotejobs",
  "himalayas",
  "jobsbase",
  "remnavi",
  "jobicy",
  "landing_jobs",
  "weworkremotely",
  "greenhouse",
  "lever",
  "career_page",
  "manual",
]);

export const subscriptionPlanEnum = pgEnum("subscription_plan", [
  "free",
  "pro",
  "team",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "trialing",
  "past_due",
  "canceled",
]);

// ─── Users (synced from Supabase Auth) ───────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull().unique(),
  lastActiveAt: timestamp("last_active_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Subscriptions ───────────────────────────────────────────────────────────

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" })
      .unique(),
    plan: subscriptionPlanEnum("plan").default("free").notNull(),
    status: subscriptionStatusEnum("status").default("active").notNull(),
    mrrCents: integer("mrr_cents").default(0).notNull(),
    currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    canceledAt: timestamp("canceled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("subscriptions_status_idx").on(t.status)]
);

// ─── AI Usage Logs ───────────────────────────────────────────────────────────

export const aiUsageLogs = pgTable(
  "ai_usage_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    model: text("model").notNull(),
    agentType: agentTypeEnum("agent_type"),
    promptTokens: integer("prompt_tokens").default(0).notNull(),
    completionTokens: integer("completion_tokens").default(0).notNull(),
    totalTokens: integer("total_tokens").default(0).notNull(),
    costUsd: real("cost_usd").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("ai_usage_logs_user_id_idx").on(t.userId),
    index("ai_usage_logs_created_at_idx").on(t.createdAt),
    index("ai_usage_logs_model_idx").on(t.model),
  ]
);

// ─── Login Events ────────────────────────────────────────────────────────────

export const loginEvents = pgTable(
  "login_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    email: text("email"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    success: boolean("success").default(true).notNull(),
    suspicious: boolean("suspicious").default(false).notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("login_events_user_id_idx").on(t.userId),
    index("login_events_created_at_idx").on(t.createdAt),
    index("login_events_suspicious_idx").on(t.suspicious),
  ]
);

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
    dedupeKey: text("dedupe_key"),
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
    uniqueIndex("jobs_dedupe_key_idx").on(t.dedupeKey),
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

export const applicationEvents = pgTable(
  "application_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    eventType: text("event_type").notNull(),
    fromStatus: applicationStatusEnum("from_status"),
    toStatus: applicationStatusEnum("to_status"),
    message: text("message").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("application_events_application_id_idx").on(t.applicationId),
    index("application_events_user_id_idx").on(t.userId),
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
  telegramLinkCode: text("telegram_link_code"),
  telegramLinkExpiresAt: timestamp("telegram_link_expires_at", { withTimezone: true }),
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

export const agentExecutionLogs = pgTable(
  "agent_execution_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    executionId: uuid("execution_id")
      .notNull()
      .references(() => agentExecutions.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    agentType: agentTypeEnum("agent_type").notNull(),
    message: text("message").notNull(),
    progress: integer("progress"),
    level: text("level").default("info").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("agent_execution_logs_execution_id_idx").on(t.executionId),
    index("agent_execution_logs_user_id_idx").on(t.userId),
    index("agent_execution_logs_created_at_idx").on(t.createdAt),
  ]
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
  subscription: one(subscriptions, { fields: [users.id], references: [subscriptions.userId] }),
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
  events: many(applicationEvents),
}));

export const applicationEventsRelations = relations(applicationEvents, ({ one }) => ({
  application: one(applications, {
    fields: [applicationEvents.applicationId],
    references: [applications.id],
  }),
  user: one(users, { fields: [applicationEvents.userId], references: [users.id] }),
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
export type Subscription = typeof subscriptions.$inferSelect;
export type AiUsageLog = typeof aiUsageLogs.$inferSelect;
export type LoginEvent = typeof loginEvents.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type JobMatch = typeof jobMatches.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type ApplicationEvent = typeof applicationEvents.$inferSelect;
export type Interview = typeof interviews.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type NotificationSettings = typeof notificationSettings.$inferSelect;
export type Resume = typeof resumes.$inferSelect;
export type AgentExecution = typeof agentExecutions.$inferSelect;
export type AgentExecutionLog = typeof agentExecutionLogs.$inferSelect;
export type PromptTemplate = typeof promptTemplates.$inferSelect;
