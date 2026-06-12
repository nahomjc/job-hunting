"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { loginSchema } from "@/lib/auth/schemas";
import { signInWithEmail } from "@/lib/auth/actions";
import { recordLoginEvent } from "@/app/actions/auth-events";
import { AuthCard, AuthCardHeader } from "@/components/auth/auth-card";
import { AuthDivider } from "@/components/auth/auth-divider";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import { FormField, ValidatedInput } from "@/components/auth/form-field";
import { PasswordInput } from "@/components/auth/password-input";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { toast } from "sonner";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (searchParams.get("error") === "auth") {
      toast.error("Authentication failed. Please try again.");
    }
  }, [searchParams]);

  function validateField(field: "email" | "password", value: string) {
    const partial = field === "email" ? { email: value, password: password || "x" } : { email: email || "a@b.co", password: value };
    const result = loginSchema.safeParse(partial);
    if (result.success) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
      return true;
    }
    const fieldError = result.error.issues.find((i) => i.path[0] === field);
    if (fieldError) {
      setErrors((prev) => ({ ...prev, [field]: fieldError.message }));
    }
    return false;
  }

  function handleBlur(field: "email" | "password") {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, field === "email" ? email : password);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ email: true, password: true });

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as string;
        newErrors[key] = issue.message;
      });
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    const { error } = await signInWithEmail(email, password);
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    await recordLoginEvent(true);
    router.push("/dashboard");
    router.refresh();
  }

  const emailValid = touched.email && !errors.email && email.includes("@");
  const passwordValid = touched.password && !errors.password && password.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <AuthCard>
        <AuthCardHeader
          title="Welcome back"
          description="Sign in to your JobHunter AI account"
        />

        <SocialAuthButtons disabled={loading} />
        <AuthDivider />

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormField
            id="email"
            label="Email"
            error={touched.email ? errors.email : undefined}
            valid={emailValid}
          >
            <ValidatedInput
              id="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (touched.email) validateField("email", e.target.value);
              }}
              onBlur={() => handleBlur("email")}
              disabled={loading}
              autoComplete="email"
              error={touched.email ? errors.email : undefined}
              valid={emailValid}
            />
          </FormField>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-primary hover:underline font-medium"
              >
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (touched.password) validateField("password", e.target.value);
              }}
              onBlur={() => handleBlur("password")}
              disabled={loading}
              autoComplete="current-password"
              error={touched.password ? errors.password : undefined}
              valid={passwordValid}
            />
            {touched.password && errors.password && (
              <p className="text-xs text-destructive flex items-center gap-1.5">
                {errors.password}
              </p>
            )}
          </div>

          <AuthSubmitButton loading={loading} loadingText="Signing in...">
            Sign in
          </AuthSubmitButton>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Create account
          </Link>
        </p>
      </AuthCard>
    </motion.div>
  );
}
