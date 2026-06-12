"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CvUpload } from "@/components/dashboard/cv-upload";
import { updateProfile } from "@/app/actions/profile";
import type { Profile } from "@/lib/db/schema";
import type { ParsedCvResult } from "@/lib/services/cv-parser-service";
import { toast } from "sonner";

interface ProfileFormProps {
  profile: Profile | null;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState(profile?.fullName ?? "");
  const [skills, setSkills] = useState((profile?.skills ?? []).join(", "));
  const [yearsOfExperience, setYearsOfExperience] = useState(
    profile?.yearsOfExperience?.toString() ?? ""
  );
  const [locations, setLocations] = useState((profile?.preferredLocations ?? []).join(", "));
  const [linkedinUrl, setLinkedinUrl] = useState(profile?.linkedinUrl ?? "");
  const [githubUrl, setGithubUrl] = useState(profile?.githubUrl ?? "");
  const [portfolioUrl, setPortfolioUrl] = useState(profile?.portfolioUrl ?? "");
  const [resumeText, setResumeText] = useState(profile?.resumeText ?? "");
  const [remotePreference, setRemotePreference] = useState<
    "remote" | "hybrid" | "onsite" | "any"
  >(profile?.remotePreference ?? "any");
  const [salaryMin, setSalaryMin] = useState(profile?.preferredSalaryMin?.toString() ?? "");
  const [salaryMax, setSalaryMax] = useState(profile?.preferredSalaryMax?.toString() ?? "");

  function handleCvParsed(data: ParsedCvResult) {
    if (data.fullName) setFullName(data.fullName);
    if (data.skills.length) setSkills(data.skills.join(", "));
    if (data.yearsOfExperience) setYearsOfExperience(String(data.yearsOfExperience));
    if (data.linkedinUrl) setLinkedinUrl(data.linkedinUrl);
    if (data.githubUrl) setGithubUrl(data.githubUrl);
    if (data.portfolioUrl) setPortfolioUrl(data.portfolioUrl);
    if (data.resumeContent) setResumeText(data.resumeContent);
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
        linkedinUrl,
        githubUrl,
        portfolioUrl,
        resumeText,
      });
      toast.success("Profile saved!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h3 className="text-sm font-medium mb-3">Upload CV</h3>
        <CvUpload onParsed={handleCvParsed} />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="skills">Skills (comma-separated)</Label>
            <Input
              id="skills"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="React, TypeScript, Node.js"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="yearsOfExperience">Years of Experience</Label>
            <Input
              id="yearsOfExperience"
              type="number"
              min={0}
              value={yearsOfExperience}
              onChange={(e) => setYearsOfExperience(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="remotePreference">Remote Preference</Label>
            <select
              id="remotePreference"
              value={remotePreference}
              onChange={(e) =>
                setRemotePreference(
                  e.target.value as "remote" | "hybrid" | "onsite" | "any"
                )
              }
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            >
              <option value="any">Any</option>
              <option value="remote">Remote only</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">On-site</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="preferredSalaryMin">Min Salary (USD)</Label>
            <Input
              id="preferredSalaryMin"
              type="number"
              value={salaryMin}
              onChange={(e) => setSalaryMin(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="preferredSalaryMax">Max Salary (USD)</Label>
            <Input
              id="preferredSalaryMax"
              type="number"
              value={salaryMax}
              onChange={(e) => setSalaryMax(e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="locations">Preferred Locations</Label>
            <Input
              id="locations"
              value={locations}
              onChange={(e) => setLocations(e.target.value)}
              placeholder="San Francisco, New York, Remote"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
            <Input
              id="linkedinUrl"
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="githubUrl">GitHub URL</Label>
            <Input
              id="githubUrl"
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="portfolioUrl">Portfolio URL</Label>
            <Input
              id="portfolioUrl"
              type="url"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="resumeText">Resume (AI-generated)</Label>
            <Textarea
              id="resumeText"
              rows={12}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Upload a CV above or paste resume text here…"
            />
          </div>
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Profile"}
        </Button>
      </form>
    </div>
  );
}
