"use client";

import { useState } from "react";
import { FileText, Link2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { CvUpload } from "@/components/dashboard/cv-upload";
import { CvReviewPanel } from "@/components/dashboard/cv-review-panel";
import {
  HuntPreferencesFields,
} from "@/components/dashboard/hunt-preferences-fields";
import { getInitialHuntState } from "@/lib/jobs/hunt-preferences";
import { updateProfile } from "@/app/actions/profile";
import type { Profile } from "@/lib/db/schema";
import type { CvReview, ParsedCvResult } from "@/lib/services/cv-parser-service";
import { parseStoredCvReview } from "@/lib/cv/cv-review";
import { normalizeProfileUrl } from "@/lib/utils";
import { toast } from "sonner";

export type ProfileFormSection = "profile" | "preferences" | "hunt";

interface ProfileFormProps {
  profile: Profile | null;
  section: ProfileFormSection;
}

export function ProfileForm({ profile, section }: ProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState(profile?.fullName ?? "");
  const [skills, setSkills] = useState((profile?.skills ?? []).join(", "));
  const [yearsOfExperience, setYearsOfExperience] = useState(
    profile?.yearsOfExperience?.toString() ?? ""
  );
  const [locations, setLocations] = useState((profile?.preferredLocations ?? []).join(", "));
  const [linkedinUrl, setLinkedinUrl] = useState(
    normalizeProfileUrl(profile?.linkedinUrl)
  );
  const [githubUrl, setGithubUrl] = useState(normalizeProfileUrl(profile?.githubUrl));
  const [portfolioUrl, setPortfolioUrl] = useState(
    normalizeProfileUrl(profile?.portfolioUrl)
  );
  const [resumeText, setResumeText] = useState(profile?.resumeText ?? "");
  const [remotePreference, setRemotePreference] = useState<
    "remote" | "hybrid" | "onsite" | "any"
  >(profile?.remotePreference ?? "any");
  const [salaryMin, setSalaryMin] = useState(profile?.preferredSalaryMin?.toString() ?? "");
  const [salaryMax, setSalaryMax] = useState(profile?.preferredSalaryMax?.toString() ?? "");
  const initialHunt = getInitialHuntState(profile);
  const [huntCountry, setHuntCountry] = useState(initialHunt.huntCountry);
  const [huntMode, setHuntMode] = useState(initialHunt.huntMode);
  const [servicesOffered, setServicesOffered] = useState(initialHunt.servicesOffered);
  const [cvReview, setCvReview] = useState<CvReview | null>(() =>
    parseStoredCvReview(profile?.preferences as Record<string, unknown> | undefined)
  );

  function handleCvParsed(data: ParsedCvResult) {
    if (data.fullName) setFullName(data.fullName);
    if (data.skills.length) setSkills(data.skills.join(", "));
    if (data.yearsOfExperience) setYearsOfExperience(String(data.yearsOfExperience));
    if (data.linkedinUrl) setLinkedinUrl(normalizeProfileUrl(data.linkedinUrl));
    if (data.githubUrl) setGithubUrl(normalizeProfileUrl(data.githubUrl));
    if (data.portfolioUrl) setPortfolioUrl(normalizeProfileUrl(data.portfolioUrl));
    if (data.resumeContent) setResumeText(data.resumeContent);
    if (data.review) setCvReview(data.review);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      await updateProfile({
        fullName,
        skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
        yearsOfExperience: Number(yearsOfExperience) || 0,
        preferredSalaryMin: Number(salaryMin) || 0,
        preferredSalaryMax: Number(salaryMax) || 0,
        preferredLocations: locations.split(",").map((s) => s.trim()).filter(Boolean),
        remotePreference: remotePreference,
        linkedinUrl: normalizeProfileUrl(linkedinUrl),
        githubUrl: normalizeProfileUrl(githubUrl),
        portfolioUrl: normalizeProfileUrl(portfolioUrl),
        resumeText,
        huntCountry: huntCountry || undefined,
        huntMode,
        servicesOffered,
      });
      toast.success("Profile saved!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  const selectClass =
    "flex h-10 w-full rounded-lg border border-input bg-background/50 px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
      {section === "profile" && (
        <>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-primary" />
              CV upload
            </div>
            <p className="text-xs text-muted-foreground">
              Drop PDF, DOCX, or TXT — AI extracts skills, grades your CV, and suggests how to improve it.
            </p>
            <CvUpload onParsed={handleCvParsed} />
            {cvReview && <CvReviewPanel review={cvReview} />}
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4 text-primary" />
              Basic information
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="skills">Skills</Label>
                <Input
                  id="skills"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="React, TypeScript, Node.js"
                />
                <p className="text-xs text-muted-foreground">Comma-separated — used for match scoring.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="yearsOfExperience">Years of experience</Label>
                <Input
                  id="yearsOfExperience"
                  type="number"
                  min={0}
                  value={yearsOfExperience}
                  onChange={(e) => setYearsOfExperience(e.target.value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Link2 className="h-4 w-4 text-primary" />
              Online presence
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="linkedinUrl">LinkedIn</Label>
                <Input
                  id="linkedinUrl"
                  type="text"
                  inputMode="url"
                  placeholder="https://linkedin.com/in/your-profile"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  onBlur={(e) => setLinkedinUrl(normalizeProfileUrl(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="githubUrl">GitHub</Label>
                <Input
                  id="githubUrl"
                  type="text"
                  inputMode="url"
                  placeholder="https://github.com/your-username"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  onBlur={(e) => setGithubUrl(normalizeProfileUrl(e.target.value))}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="portfolioUrl">Portfolio</Label>
                <Input
                  id="portfolioUrl"
                  type="text"
                  inputMode="url"
                  placeholder="https://yourportfolio.com"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  onBlur={(e) => setPortfolioUrl(normalizeProfileUrl(e.target.value))}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="resumeText">Resume text</Label>
            <Textarea
              id="resumeText"
              rows={12}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Upload a CV above or paste resume text here…"
              className="font-mono text-sm leading-relaxed"
            />
            <p className="text-xs text-muted-foreground">
              AI uses this for tailoring applications and scoring job fit.
            </p>
          </div>
        </>
      )}

      {section === "preferences" && (
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="remotePreference">Work style preference</Label>
            <select
              id="remotePreference"
              value={remotePreference}
              onChange={(e) =>
                setRemotePreference(
                  e.target.value as "remote" | "hybrid" | "onsite" | "any"
                )
              }
              className={selectClass}
            >
              <option value="any">Open to any</option>
              <option value="remote">Remote only</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">On-site only</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="preferredSalaryMin">Minimum salary (USD)</Label>
            <Input
              id="preferredSalaryMin"
              type="number"
              min={0}
              placeholder="80000"
              value={salaryMin}
              onChange={(e) => setSalaryMin(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="preferredSalaryMax">Maximum salary (USD)</Label>
            <Input
              id="preferredSalaryMax"
              type="number"
              min={0}
              placeholder="150000"
              value={salaryMax}
              onChange={(e) => setSalaryMax(e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="locations">Preferred locations</Label>
            <Input
              id="locations"
              value={locations}
              onChange={(e) => setLocations(e.target.value)}
              placeholder="San Francisco, New York, Remote, Europe"
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated cities or regions — boosts match scores for those areas.
            </p>
          </div>
        </div>
      )}

      {section === "hunt" && (
        <HuntPreferencesFields
          profile={profile}
          huntCountry={huntCountry}
          huntMode={huntMode}
          servicesOffered={servicesOffered}
          onHuntCountryChange={setHuntCountry}
          onHuntModeChange={setHuntMode}
          onServicesChange={setServicesOffered}
        />
      )}

      <div className="flex items-center gap-3 border-t border-border/60 pt-6">
        <Button type="submit" variant="premium" disabled={loading}>
          {loading ? "Saving…" : "Save changes"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Profile data is saved across all settings tabs.
        </p>
      </div>
    </form>
  );
}
