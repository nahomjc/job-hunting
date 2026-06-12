import type {
  Application,
  Job,
  JobMatch,
  Profile,
  Interview,
  Notification,
  Resume,
} from "@/lib/db/schema";

export type ApplicationStatus = Application["status"];
export type RemotePreference = NonNullable<Profile["remotePreference"]>;
export type JobProvider = Job["provider"];

export interface JobWithMatch extends Job {
  match?: JobMatch | null;
  application?: Application | null;
}

export interface ApplicationWithJob extends Application {
  job: Job;
  match?: JobMatch | null;
}

export interface InterviewWithDetails extends Interview {
  application: ApplicationWithJob;
}

export interface DashboardStats {
  totalJobsFound: number;
  applicationsSent: number;
  interviewsReceived: number;
  responseRate: number;
  offerRate: number;
  highMatchJobs: number;
}

export interface JobSearchResult {
  externalId: string;
  provider: JobProvider;
  company: string;
  title: string;
  description: string;
  url: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  location?: string;
  isRemote: boolean;
  tags: string[];
  postedAt?: Date;
  rawData?: Record<string, unknown>;
}

export interface MatchScoreResult {
  score: number;
  reasons: string[];
  explanation: string;
}

export interface AgentResult<T = Record<string, unknown>> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ProfileFormData {
  fullName: string;
  skills: string[];
  yearsOfExperience: number;
  preferredSalaryMin: number;
  preferredSalaryMax: number;
  preferredLocations: string[];
  remotePreference: RemotePreference;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
  resumeText: string;
}

export interface JobMatchFilters {
  minScore?: number;
  minSalary?: number;
  remote?: boolean;
  location?: string;
  status?: ApplicationStatus;
}

export type NotificationWithMeta = Notification;
