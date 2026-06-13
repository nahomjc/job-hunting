export const PIPELINE_CANCEL_MESSAGE = "Cancelled by user";

export class PipelineCancelledError extends Error {
  constructor(message = PIPELINE_CANCEL_MESSAGE) {
    super(message);
    this.name = "PipelineCancelledError";
  }
}

export const PIPELINE_AGENT_TYPES = ["manager", "job_hunter", "job_match"] as const;

export type PipelineAgentType = (typeof PIPELINE_AGENT_TYPES)[number];
