import { Header } from "@/components/dashboard/header";
import { AgentActivityView } from "@/components/agents/agent-activity-view";
import { getAuthUser } from "@/lib/supabase/server";
import { userHasCv } from "@/lib/profile/has-cv";

export default async function AgentsPage() {
  const user = await getAuthUser();
  if (!user) return null;

  let hasCv = false;
  try {
    hasCv = await userHasCv(user.id);
  } catch {
    // DB not configured
  }

  return (
    <>
      <Header
        title="Agent Activity"
        description="Real-time view of your AI agents at work"
      />
      <div className="flex-1 p-4 md:p-8">
        <AgentActivityView hasCv={hasCv} />
      </div>
    </>
  );
}
