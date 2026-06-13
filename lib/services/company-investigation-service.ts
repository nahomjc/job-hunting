import { companyInvestigatorAgent } from "@/lib/ai/agents/company-investigator-agent";
import { getHuntPreferences, getCountryLabel } from "@/lib/jobs/hunt-preferences";
import type { ServiceOffered } from "@/lib/jobs/hunt-preferences";
import { jobRepository } from "@/lib/repositories/job-repository";
import { profileRepository } from "@/lib/repositories/profile-repository";
import {
  companyInvestigationRepository,
  type InvestigationInput,
} from "@/lib/repositories/company-investigation-repository";
import {
  extractDescriptionSignals,
  probeCompanyWebsite,
} from "@/lib/services/company-web-probe";

export const companyInvestigationService = {
  async investigate(
    userId: string,
    jobId: string,
    pitchService?: ServiceOffered
  ) {
    const [profile, job] = await Promise.all([
      profileRepository.getByUserId(userId),
      jobRepository.findById(jobId),
    ]);

    if (!profile) throw new Error("Complete your profile first.");
    if (!job) throw new Error("Job not found.");

    const website = await probeCompanyWebsite(job.company, job.url);
    const signals = extractDescriptionSignals(job.description ?? "");
    const huntPrefs = getHuntPreferences(profile.preferences);

    const result = await companyInvestigatorAgent.run(
      {
        profile,
        job,
        websiteStatus: website.status,
        websiteUrl: website.url,
        signals,
        pitchService,
      },
      userId
    );

    if (!result.success || !result.data) {
      throw new Error(result.error ?? "Investigation failed");
    }

    const { analysis, pitch } = result.data;
    const pitchLetter = pitch
      ? `Subject: ${pitch.subject}\n\n${pitch.body}`
      : undefined;

    const record: InvestigationInput = {
      userId,
      jobId,
      company: job.company,
      country: huntPrefs.huntCountry
        ? getCountryLabel(huntPrefs.huntCountry)
        : job.location ?? undefined,
      websiteUrl: website.url,
      websiteStatus: website.status,
      gaps: analysis.gaps,
      intelSummary: analysis.intelSummary,
      pitchLetter,
      pitchService,
    };

    return companyInvestigationRepository.upsert(record);
  },
};
