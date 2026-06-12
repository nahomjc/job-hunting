"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { registerSchema } from "@/lib/auth/schemas";
import { signUpWithEmail } from "@/lib/auth/actions";
import { AuthCard, AuthCardHeader } from "@/components/auth/auth-card";
import { AuthDivider } from "@/components/auth/auth-divider";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import { FormField, ValidatedInput } from "@/components/auth/form-field";
import { PasswordInput } from "@/components/auth/password-input";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { toast } from "sonner";

function getPasswordStrength(password: string): { score: number; label: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const labels = ["Weak", "Fair", "Good", "Strong"];
  return { score, label: labels[Math.max(0, score - 1)] ?? "Weak" };
}

export function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const strength = getPasswordStrength(password);

  function validateAll() {
    const result = registerSchema.safeParse({ email, password, confirmPassword });
    if (result.success) {
      setErrors({});
      return true;
    }
    const newErrors: Record<string, string> = {};
    result.error.issues.forEach((issue) => {
      const key = issue.path[0] as string;
      newErrors[key] = issue.message;
    });
    setErrors(newErrors);
    return false;
  }

  function validateField(field: keyof typeof errors) {
    validateAll();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ email: true, password: true, confirmPassword: true });
    if (!validateAll()) return;

    setLoading(true);
    const { error } = await signUpWithEmail(email, password);
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Account created! Check your email to confirm.");
    router.push("/dashboard");
    router.refresh();
  }

  const emailValid = touched.email && !errors.email && email.includes("@");
  const passwordValid = touched.password && !errors.password && password.length >= 8;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <AuthCard>
        <AuthCardHeader
          title="Create your account"
          description="Start your AI-powered job hunt in minutes"
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
                if (touched.email) validateField("email");
              }}
              onBlur={() => setTouched((p) => ({ ...p, email: true }))}
              disabled={loading}
              autoComplete="email"
              error={touched.email ? errors.email : undefined}
              valid={emailValid}
            />
          </FormField>

          <FormField
            id="password"
            label="Password"
            error={touched.password ? errors.password : undefined}
            hint={
              password && !errors.password
                ? `Strength: ${strength.label}`
                : "Min. 8 characters with uppercase and number"
            }
          >
            <PasswordInput
              id="password"
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (touched.password) validateField("password");
              }}
              onBlur={() => setTouched((p) => ({ ...p, password: true }))}
              disabled={loading}
              autoComplete="new-password"
              error={touched.password ? errors.password : undefined}
              valid={passwordValid}
            />
            {password.length > 0 && (
              <div className="flex gap-1 pt-1">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                      strength.score >= level
                        ? strength.score <= 2
                          ? "bg-warning"
                          : "bg-success"
                        : "bg-muted"
                    }`}
                  />
                ))}
              </div>
            )}
          </FormField>

          <FormField
            id="confirmPassword"
            label="Confirm password"
            error={touched.confirmPassword ? errors.confirmPassword : undefined}
            valid={
              touched.confirmPassword &&
              !errors.confirmPassword &&
              confirmPassword === password &&
              confirmPassword.length > 0
            }
          >
            <PasswordInput
              id="confirmPassword"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (touched.confirmPassword) validateField("confirmPassword");
              }}
              onBlur={() => setTouched((p) => ({ ...p, confirmPassword: true }))}
              disabled={loading}
              autoComplete="new-password"
              error={touched.confirmPassword ? errors.confirmPassword : undefined}
              valid={
                touched.confirmPassword &&
                !errors.confirmPassword &&
                confirmPassword === password &&
                confirmPassword.length > 0
              }
            />
          </FormField>

          <AuthSubmitButton loading={loading} loadingText="Creating account...">
            Create account
          </AuthSubmitButton>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground leading-relaxed">
          By creating an account, you agree to our{" "}
          <Link href="#" className="underline hover:text-foreground">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="#" className="underline hover:text-foreground">
            Privacy Policy
          </Link>
          .
        </p>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </AuthCard>
    </motion.div>
  );
}
