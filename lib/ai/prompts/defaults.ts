export const DEFAULT_PROMPTS = {
  job_match: {
    key: "job_match",
    name: "Job Match Scoring",
    description: "Score a job against a user profile",
    systemPrompt: `You are an expert career advisor and technical recruiter. Analyze job postings against candidate profiles and provide accurate match scores from 0-100. Be objective and specific. Always respond in valid JSON.`,
    userPromptTemplate: `Score this job against the candidate profile.

## Candidate Profile
Name: {{fullName}}
Skills: {{skills}}
Years of Experience: {{yearsOfExperience}}
Preferred Salary: {{salaryRange}}
Preferred Locations: {{locations}}
Remote Preference: {{remotePreference}}
Resume Summary: {{resumeText}}

## Job Posting
Company: {{company}}
Title: {{title}}
Location: {{location}}
Remote: {{isRemote}}
Salary: {{salaryRange}}
Description:
{{description}}

Respond with JSON:
{
  "score": <number 0-100>,
  "reasons": ["reason1", "reason2", ...],
  "explanation": "Brief overall explanation"
}`,
  },
  resume_tailor: {
    key: "resume_tailor",
    name: "Tailored Resume",
    description: "Generate ATS-friendly tailored resume",
    systemPrompt: `You are an expert resume writer specializing in software engineering roles. Create ATS-friendly, tailored resumes that highlight relevant experience. Use clear sections and bullet points. Do not fabricate experience.`,
    userPromptTemplate: `Create a tailored resume for this job application.

## Candidate Profile
{{profileJson}}

## Target Job
Company: {{company}}
Title: {{title}}
Description:
{{description}}

Return the resume as plain text with clear sections: Summary, Skills, Experience, Education.`,
  },
  cover_letter: {
    key: "cover_letter",
    name: "Cover Letter",
    description: "Generate personalized cover letter",
    systemPrompt: `You are an expert cover letter writer for software engineering roles. Write concise, personalized cover letters that mention specific relevant experience. Keep it under 400 words.`,
    userPromptTemplate: `Write a cover letter for this application.

## Candidate
{{profileJson}}

## Job
Company: {{company}}
Title: {{title}}
Description:
{{description}}

Write a professional cover letter. Return plain text only.`,
  },
  outreach_email: {
    key: "outreach_email",
    name: "Recruiter Outreach Email",
    description: "Draft recruiter outreach email",
    systemPrompt: `You write concise, professional recruiter outreach emails for software engineers. Be personable but professional. Under 200 words.`,
    userPromptTemplate: `Draft a recruiter outreach email.

## Candidate
{{profileJson}}

## Job
Company: {{company}}
Title: {{title}}

Return JSON: { "subject": "...", "body": "..." }`,
  },
  outreach_linkedin: {
    key: "outreach_linkedin",
    name: "LinkedIn Outreach",
    description: "Draft LinkedIn connection/message",
    systemPrompt: `You write concise LinkedIn messages for job seekers connecting with recruiters. Under 300 characters for connection note, or under 500 for InMail.`,
    userPromptTemplate: `Draft a LinkedIn message to a recruiter about this role.

## Candidate
{{profileJson}}

## Job
Company: {{company}}
Title: {{title}}

Return JSON: { "message": "..." }`,
  },
  follow_up: {
    key: "follow_up",
    name: "Follow-up Message",
    description: "Draft application follow-up",
    systemPrompt: `You write polite, professional follow-up messages after job applications. Keep under 150 words.`,
    userPromptTemplate: `Draft a follow-up message for an application submitted {{daysAgo}} days ago.

## Candidate
{{profileJson}}

## Job
Company: {{company}}
Title: {{title}}

Return plain text message.`,
  },
  interview_prep: {
    key: "interview_prep",
    name: "Interview Preparation",
    description: "Generate interview prep notes and questions",
    systemPrompt: `You are an interview coach for software engineering roles. Provide practical preparation notes and likely interview questions. Respond in JSON.`,
    userPromptTemplate: `Prepare interview notes for this role.

## Candidate
{{profileJson}}

## Job
Company: {{company}}
Title: {{title}}
Description:
{{description}}

## Interview Stage
{{stage}}

Return JSON:
{
  "prepNotes": "Detailed preparation notes in markdown",
  "likelyQuestions": ["question1", "question2", ...]
}`,
  },
  resume_analysis: {
    key: "resume_analysis",
    name: "Resume Analysis",
    description: "Parse CV and generate structured profile + ATS resume",
    systemPrompt: `You are an expert resume writer and technical recruiter. Parse CVs for software engineers and produce accurate structured data plus a polished ATS-friendly resume. Never invent experience, skills, or employers. Respond in valid JSON only.`,
    userPromptTemplate: `Parse this CV/resume and build a complete professional profile.

{{resumeText}}

Return JSON:
{
  "fullName": "Candidate full name or empty string",
  "skills": ["skill1", "skill2"],
  "yearsOfExperience": <number>,
  "summary": "2-3 sentence professional summary",
  "resumeContent": "Full ATS-friendly resume in plain text with sections: Summary, Skills, Experience, Education. Use bullet points for achievements.",
  "linkedinUrl": "URL if found, else empty string",
  "githubUrl": "URL if found, else empty string",
  "portfolioUrl": "URL if found, else empty string"
}`,
  },
} as const;

export type PromptKey = keyof typeof DEFAULT_PROMPTS;
