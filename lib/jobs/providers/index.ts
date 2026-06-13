import { RemoteOKProvider } from "./remoteok";
import { WellfoundProvider } from "./wellfound";
import { RemotiveProvider } from "./remotive";
import { ArbeitnowProvider } from "./arbeitnow";
import { RemoteJobsOrgProvider } from "./remotejobs-org";
import { HimalayasProvider } from "./himalayas";
import { JobsBaseProvider } from "./jobsbase";
import { RemNaviProvider } from "./remnavi";
import { JobicyProvider } from "./jobicy";
import { LandingJobsProvider } from "./landing-jobs";
import { WeWorkRemotelyProvider } from "./weworkremotely";
import { GreenhouseProvider } from "./greenhouse";
import { LeverProvider } from "./lever";
import { CareerPageProvider } from "./career-page";
import { EthioJobsProvider } from "./ethiojobs";
import { AfriworkProvider } from "./afriwork";
import { HaHuJobsProvider } from "./hahujobs";
import type { JobProviderAdapter } from "./types";
import type { Profile } from "@/lib/db/schema";
import { shouldUseEthiopiaProviders } from "@/lib/jobs/ethiopia-hunt";
import { getHuntPreferences } from "@/lib/jobs/hunt-preferences";

/** All job boards searched on each hunt (no API key required unless noted). */
export function createDefaultProviders(): JobProviderAdapter[] {
  const providers: JobProviderAdapter[] = [
    new RemoteOKProvider(),
    new RemotiveProvider(),
    new ArbeitnowProvider(),
    new RemoteJobsOrgProvider(),
    new HimalayasProvider(),
    new JobsBaseProvider(),
    new RemNaviProvider(),
    new JobicyProvider(),
    new LandingJobsProvider(),
    new WeWorkRemotelyProvider(),
    new WellfoundProvider(), // often blocked (403) — kept for when it works
  ];

  if (process.env.GREENHOUSE_BOARD_TOKEN && process.env.GREENHOUSE_COMPANY_NAME) {
    providers.push(
      new GreenhouseProvider(
        process.env.GREENHOUSE_BOARD_TOKEN,
        process.env.GREENHOUSE_COMPANY_NAME
      )
    );
  }

  if (process.env.LEVER_COMPANY_SLUG && process.env.LEVER_COMPANY_NAME) {
    providers.push(
      new LeverProvider(process.env.LEVER_COMPANY_SLUG, process.env.LEVER_COMPANY_NAME)
    );
  }

  if (process.env.CAREER_PAGE_API_ENDPOINT && process.env.CAREER_PAGE_COMPANY_NAME) {
    providers.push(
      new CareerPageProvider({
        companyName: process.env.CAREER_PAGE_COMPANY_NAME,
        careersUrl: process.env.CAREER_PAGE_URL ?? "",
        apiEndpoint: process.env.CAREER_PAGE_API_ENDPOINT,
      })
    );
  }

  return providers;
}

export function createEthiopiaProviders(): JobProviderAdapter[] {
  return [new EthioJobsProvider(), new AfriworkProvider(), new HaHuJobsProvider()];
}

export function createProvidersForHunt(profile: Profile, huntCountry?: string): JobProviderAdapter[] {
  const providers = createDefaultProviders();
  const country = huntCountry ?? getHuntPreferences(profile.preferences).huntCountry;
  if (shouldUseEthiopiaProviders(profile, country)) {
    providers.push(...createEthiopiaProviders());
  }
  return providers;
}

export function countProvidersForHunt(profile: Profile | null, huntCountry?: string): number {
  if (!profile) return createDefaultProviders().length;
  return createProvidersForHunt(profile, huntCountry).length;
}

export function ethiopiaProvidersEnabled(profile: Profile | null, huntCountry?: string): boolean {
  if (!profile) return false;
  const country = huntCountry ?? getHuntPreferences(profile.preferences).huntCountry;
  return shouldUseEthiopiaProviders(profile, country);
}

export function registerProvider(provider: JobProviderAdapter) {
  return provider;
}

export type { JobProviderAdapter, SearchOptions } from "./types";
export {
  RemoteOKProvider,
  WellfoundProvider,
  RemotiveProvider,
  ArbeitnowProvider,
  RemoteJobsOrgProvider,
  HimalayasProvider,
  JobsBaseProvider,
  RemNaviProvider,
  JobicyProvider,
  LandingJobsProvider,
  WeWorkRemotelyProvider,
  GreenhouseProvider,
  LeverProvider,
  CareerPageProvider,
  EthioJobsProvider,
  AfriworkProvider,
  HaHuJobsProvider,
};
