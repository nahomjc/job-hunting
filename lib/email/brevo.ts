import { BrevoClient } from "@getbrevo/brevo";

let client: BrevoClient | null = null;

function getClient(): BrevoClient | null {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return null;

  if (!client) {
    client = new BrevoClient({ apiKey });
  }
  return client;
}

export function isBrevoConfigured(): boolean {
  return Boolean(process.env.BREVO_API_KEY && process.env.BREVO_SENDER_EMAIL);
}

export function getSender() {
  return {
    name: process.env.BREVO_SENDER_NAME ?? "JobHunter AI",
    email: process.env.BREVO_SENDER_EMAIL!,
  };
}

function textToHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
}

export interface SendEmailOptions {
  to: string;
  toName?: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const brevo = getClient();
  const senderEmail = process.env.BREVO_SENDER_EMAIL;

  if (!brevo || !senderEmail) {
    console.warn("Brevo email not configured. Set BREVO_API_KEY and BREVO_SENDER_EMAIL.");
    return false;
  }

  try {
    await brevo.transactionalEmails.sendTransacEmail({
      sender: getSender(),
      to: [{ email: options.to, name: options.toName }],
      subject: options.subject,
      textContent: options.text,
      htmlContent: options.html ?? `<p>${textToHtml(options.text)}</p>`,
    });
    return true;
  } catch (error) {
    console.error("Brevo send failed:", error);
    return false;
  }
}

/** SMTP settings for Supabase Auth (configure in Supabase Dashboard). */
export const BREVO_SMTP = {
  host: process.env.BREVO_SMTP_HOST ?? "smtp-relay.brevo.com",
  port: Number(process.env.BREVO_SMTP_PORT ?? 587),
  user: process.env.BREVO_SMTP_USER ?? "",
  password: process.env.BREVO_SMTP_KEY ?? "",
} as const;
