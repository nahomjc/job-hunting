import { FileText } from "lucide-react";
import { Header } from "@/components/dashboard/header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthUser } from "@/lib/supabase/server";
import { resumeRepository } from "@/lib/repositories/resume-repository";

export default async function ResumesPage() {
  const user = await getAuthUser();
  if (!user) return null;

  let resumes: Awaited<ReturnType<typeof resumeRepository.findForUser>> = [];
  try {
    resumes = await resumeRepository.findForUser(user.id);
  } catch {
    // DB not configured
  }

  return (
    <>
      <Header title="Resume Versions" description="AI-tailored resumes for each application" />
      <div className="flex-1 p-4 md:p-8">
        {resumes.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No resume versions yet"
            description="Generate tailored resumes from the Applications page when you're ready to apply."
          />
        ) : (
          <div className="space-y-4 max-w-3xl">
            {resumes.map((resume) => (
              <Card key={resume.id}>
                <CardHeader>
                  <CardTitle className="text-base">{resume.title}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(resume.createdAt).toLocaleDateString()}
                  </p>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm whitespace-pre-wrap font-sans text-muted-foreground max-h-64 overflow-y-auto rounded-lg bg-muted p-4">
                    {resume.content}
                  </pre>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
