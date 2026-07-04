import { jobMatchRepository } from "@/lib/repositories/job-match-repository";
import { applicationRepository } from "@/lib/repositories/application-repository";
import {
  getStatsDateRange,
  type StatsPeriod,
} from "@/lib/analytics/stats-period";
import type { DashboardStats } from "@/types";

export const analyticsService = {
  async getDashboardStats(
    userId: string,
    period: StatsPeriod = "all_time"
  ): Promise<DashboardStats> {
    const range = period === "all_time" ? undefined : getStatsDateRange(period);

    const [totalJobsFound, applicationsSent, interviewsReceived, highMatchJobs] =
      await Promise.all([
        jobMatchRepository.countMatchesForUser(userId, range),
        applicationRepository.countByStatus(
          userId,
          ["applied", "recruiter_contacted", "interview_scheduled", "offer_received", "rejected"],
          range
        ),
        applicationRepository.countByStatus(
          userId,
          ["interview_scheduled", "offer_received"],
          range,
          "updated"
        ),
        jobMatchRepository.countHighMatches(userId, 80, range),
      ]);

    const responses = await applicationRepository.countByStatus(
      userId,
      ["recruiter_contacted", "interview_scheduled", "offer_received", "rejected"],
      range,
      "updated"
    );

    const offers = await applicationRepository.countByStatus(
      userId,
      ["offer_received"],
      range,
      "updated"
    );

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
