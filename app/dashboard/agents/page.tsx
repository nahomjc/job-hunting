import { Header } from "@/components/dashboard/header";
import { AgentActivityView } from "@/components/agents/agent-activity-view";

export default function AgentsPage() {
  return (
    <>
      <Header
        title="Agent Activity"
        description="Real-time view of your AI agents at work"
      />
      <div className="flex-1 p-4 md:p-8">
        <AgentActivityView />
      </div>
    </>
  );
}
