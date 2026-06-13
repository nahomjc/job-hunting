/** Surface the underlying Postgres message when Drizzle wraps a failed query. */
export function formatAgentError(error: unknown): string {
  if (!(error instanceof Error)) return "Unknown error";

  const cause = (error as Error & { cause?: unknown }).cause;
  if (cause instanceof Error && cause.message) {
    return cause.message;
  }

  return error.message;
}
