import { jobRepository } from "@/lib/repositories/job-repository";
import { applicationRepository } from "@/lib/repositories/application-repository";
import { jobMatchRepository } from "@/lib/repositories/job-match-repository";
import type { DashboardStats } from "@/types";

export const analyticsService = {
  async getDashboardStats(userId: string): Promise<DashboardStats> {
    const [totalJobsFound, applicationsSent, interviewsReceived, highMatchJobs] =
      await Promise.all([
        jobRepository.count(),
        applicationRepository.countByStatus(userId, ["applied", "recruiter_contacted", "interview_scheduled", "offer_received", "rejected"]),
        applicationRepository.countByStatus(userId, ["interview_scheduled", "offer_received"]),
        jobMatchRepository.countHighMatches(userId, 80),
      ]);

    const responses = await applicationRepository.countByStatus(userId, [
      "recruiter_contacted",
      "interview_scheduled",
      "offer_received",
      "rejected",
    ]);

    const offers = await applicationRepository.countByStatus(userId, ["offer_received"]);

    const responseRate =
      applicationsSent > 0 ? (responses / applicationsSent) * 100 : 0;
    const offerRate = applicationsSent > 0 ? (offers / applicationsSent) * 100 : 0;

    return {
      totalJobsFound,
      applicationsSent,
      interviewsReceived,
      responseRate,
      offerRate,
      highMatchJobs,
    };
  },
};
