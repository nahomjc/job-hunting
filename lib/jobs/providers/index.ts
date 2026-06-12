import { RemoteOKProvider } from "./remoteok";
import { WellfoundProvider } from "./wellfound";
import { RemotiveProvider } from "./remotive";
import { ArbeitnowProvider } from "./arbeitnow";
import { RemoteJobsOrgProvider } from "./remotejobs-org";
import { HimalayasProvider } from "./himalayas";
import { JobsBaseProvider } from "./jobsbase";
import { RemNaviProvider } from "./remnavi";
import { GreenhouseProvider } from "./greenhouse";
import { LeverProvider } from "./lever";
import { CareerPageProvider } from "./career-page";
import type { JobProviderAdapter } from "./types";

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
  GreenhouseProvider,
  LeverProvider,
  CareerPageProvider,
};
