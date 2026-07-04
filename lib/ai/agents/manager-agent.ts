import { BaseAgent, type AgentRunContext } from "./base-agent";
import { jobHunterAgent } from "./job-hunter-agent";
import { jobMatchAgent } from "./job-match-agent";
import { resumeAgent } from "./resume-agent";
import { coverLetterAgent } from "./cover-letter-agent";
import { outreachAgent } from "./outreach-agent";
import { interviewAgent } from "./interview-agent";
import { profileRepository } from "@/lib/repositories/profile-repository";
import { jobRepository } from "@/lib/repositories/job-repository";
import { jobMatchRepository } from "@/lib/repositories/job-match-repository";
import { applicationRepository } from "@/lib/repositories/application-repository";
import { resumeRepository } from "@/lib/repositories/resume-repository";
import { notificationService } from "@/lib/services/notification-service";
import { companyInvestigationService } from "@/lib/services/company-investigation-service";
import type { ServiceOffered } from "@/lib/jobs/hunt-preferences";
import { profileHasCv, CV_REQUIRED_MESSAGE } from "@/lib/profile/has-cv";
import type { Job, Profile } from "@/lib/db/schema";

export type ManagerTask =
  | "full_pipeline"
  | "search_jobs"
  | "score_jobs"
  | "generate_application"
  | "prepare_interview"
  | "investigate_company";

interface ManagerInput {
  userId: string;
  task: ManagerTask;
  jobId?: string;
  interviewStage?: string;
  pitchService?: ServiceOffered;
}

interface ManagerOutput {
  task: ManagerTask;
  results: Record<string, unknown>;
}

export class ManagerAgent extends BaseAgent<ManagerInput, ManagerOutput> {
  readonly type = "manager" as const;
  readonly name = "Manager Agent";

  protected async execute(input: ManagerInput, ctx: AgentRunContext): Promise<ManagerOutput> {
    const { userId, task } = input;
    await ctx.log(`Manager orchestrating task: ${task}`, { progress: 8 });

    const profile = await profileRepository.getByUserId(userId);
    if (!profile) throw new Error("Profile not found. Complete your profile first.");

    if (task === "full_pipeline" || task === "search_jobs") {
      await this.assertHasCv(userId, profile);
    }

    switch (task) {
      case "search_jobs":
        return { task, results: await this.searchJobs(userId, profile) };
      case "score_jobs":
        return { task, results: await this.scoreJobs(userId, profile) };
      case "generate_application":
        if (!input.jobId) throw new Error("jobId required");
        return {
          task,
          results: await this.generateApplication(userId, profile, input.jobId),
        };
      case "prepare_interview":
        if (!input.jobId) throw new Error("jobId required");
        return {
          task,
          results: await this.prepareInterview(
            userId,
            profile,
            input.jobId,
            input.interviewStage ?? "technical"
          ),
        };
      case "investigate_company":
        if (!input.jobId) throw new Error("jobId required");
        return {
          task,
          results: await this.investigateCompany(userId, input.jobId, input.pitchService),
        };
      case "full_pipeline":
        return { task, results: await this.fullPipeline(userId, profile, ctx) };
      default:
        throw new Error(`Unknown task: ${task}`);
    }
  }

  private async assertHasCv(userId: string, profile: Profile) {
    if (profileHasCv(profile)) return;
    const resume = await resumeRepository.findDefault(userId);
    if (resume?.content?.trim()) return;
    throw new Error(CV_REQUIRED_MESSAGE);
  }

  private async searchJobs(userId: string, profile: Profile) {
    return (await jobHunterAgent.run({ profile }, userId)).data ?? {};
  }

  private async scoreJobs(userId: string, profile: Profile, limit = 20, ctx?: AgentRunContext) {
    const unscored = await jobRepository.findUnscoredForUser(userId, limit);
    let scored = 0;
    let failed = 0;
    const highMatches: string[] = [];

    for (const job of unscored) {
      await ctx?.assertNotCancelled();
      const result = await jobMatchAgent.run({ profile, job }, userId);
      if (!result.success || !result.data) {
        failed++;
        continue;
      }

      await jobMatchRepository.upsert(userId, job.id, result.data);
      scored++;

      if (result.data.score >= 80) {
        highMatches.push(job.id);
        await notificationService.notifyHighMatch(userId, job, result.data.score);
      }
    }

    const remaining = (await jobRepository.findUnscoredForUser(userId, 500)).length;

    return {
      scored,
      failed,
      attempted: unscored.length,
      highMatches: highMatches.length,
      remaining,
    };
  }

  private async generateApplication(userId: string, profile: Profile, jobId: string) {
    const job = await jobRepository.findById(jobId);
    if (!job) throw new Error("Job not found");

    const [resumeResult, coverResult, outreachResult] = await Promise.all([
      resumeAgent.run({ profile, job }, userId),
      coverLetterAgent.run({ profile, job }, userId),
      outreachAgent.run({ profile, job, type: "email" }, userId),
    ]);

    if (resumeResult.success && resumeResult.data) {
      await resumeRepository.create({
        userId,
        jobId,
        title: resumeResult.data.title,
        content: resumeResult.data.content,
      });
    }

    const application = await applicationRepository.upsert(userId, jobId, {
      coverLetter: coverResult.data?.content,
      outreachEmail: outreachResult.data?.email
        ? JSON.stringify(outreachResult.data.email)
        : undefined,
      status: "saved",
    });

    return {
      applicationId: application.id,
      resume: resumeResult.success,
      coverLetter: coverResult.success,
      outreach: outreachResult.success,
    };
  }

  private async prepareInterview(
    userId: string,
    profile: Profile,
    jobId: string,
    stage: string
  ) {
    const job = await jobRepository.findById(jobId);
    if (!job) throw new Error("Job not found");

    const result = await interviewAgent.run({ profile, job, stage }, userId);
    return result.data ?? {};
  }

  private async investigateCompany(
    userId: string,
    jobId: string,
    pitchService?: ServiceOffered
  ) {
    const investigation = await companyInvestigationService.investigate(
      userId,
      jobId,
      pitchService
    );
    return { investigationId: investigation.id, company: investigation.company };
  }

  private async fullPipeline(userId: string, profile: Profile, ctx: AgentRunContext) {
    const search = await this.searchJobs(userId, profile);
    await ctx.assertNotCancelled();
    const scoring = await this.scoreJobs(userId, profile, 20, ctx);
    return { search, scoring };
  }
}

export const managerAgent = new ManagerAgent();
