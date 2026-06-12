"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, MailCheck } from "lucide-react";
import { forgotPasswordSchema } from "@/lib/auth/schemas";
import { resetPassword } from "@/lib/auth/actions";
import { AuthCard, AuthCardHeader } from "@/components/auth/auth-card";
import { FormField, ValidatedInput } from "@/components/auth/form-field";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState("");

  function validateEmail(value: string) {
    const result = forgotPasswordSchema.safeParse({ email: value });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Invalid email");
      return false;
    }
    setError("");
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!validateEmail(email)) return;

    setLoading(true);
    const { error: resetError } = await resetPassword(email);
    setLoading(false);

    if (resetError) {
      toast.error(resetError.message);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <AuthCard className="text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <MailCheck className="h-7 w-7 text-primary" />
          </div>
          <AuthCardHeader
            title="Check your inbox"
            description={`We sent a password reset link to ${email}. Click the link in the email to set a new password.`}
            className="mb-6"
          />
          <Button variant="outline" className="w-full" asChild>
            <Link href="/login">
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </Link>
          </Button>
          <button
            type="button"
            className="mt-4 text-xs text-muted-foreground hover:text-primary transition-colors"
            onClick={() => {
              setSent(false);
              setEmail("");
              setTouched(false);
            }}
          >
            Didn&apos;t receive it? Try again
          </button>
        </AuthCard>
      </motion.div>
    );
  }

  const emailValid = touched && !error && email.includes("@");

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <AuthCard>
        <AuthCardHeader
          title="Reset your password"
          description="Enter your email and we'll send you a link to reset your password."
        />

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormField
            id="email"
            label="Email"
            error={touched ? error : undefined}
            valid={emailValid}
          >
            <ValidatedInput
              id="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (touched) validateEmail(e.target.value);
              }}
              onBlur={() => {
                setTouched(true);
                validateEmail(email);
              }}
              disabled={loading}
              autoComplete="email"
              error={touched ? error : undefined}
              valid={emailValid}
            />
          </FormField>

          <AuthSubmitButton loading={loading} loadingText="Sending link...">
            Send reset link
          </AuthSubmitButton>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </Link>
        </p>
      </AuthCard>
    </motion.div>
  );
}
