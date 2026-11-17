"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/auth-client";
import { loginSchema } from "@/lib/validations/auth";
import AuthField from "@/components/auth/AuthField";
import AuthAlert from "@/components/auth/AuthAlert";
import AuthSubmitButton from "@/components/auth/AuthSubmitButton";
import { LockIcon, MailIcon } from "@/components/auth/icons";

type FieldErrors = Partial<Record<"email" | "password", string>>;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const errors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setIsSubmitting(true);

    await authClient.signIn.email(
      { email: result.data.email, password: result.data.password },
      {
        onSuccess: () => {
          router.push("/dashboard");
          router.refresh();
        },
        onError: () => {
          setFormError("Invalid email or password.");
          setIsSubmitting(false);
        },
      }
    );
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 shadow-lg">
      <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
      <p className="mt-1 text-sm text-slate-500">Sign in to your project management workspace</p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
        <AuthField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@university.edu"
          icon={<MailIcon />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
        />
        <AuthField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          icon={<LockIcon />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
        />
        {formError && <AuthAlert message={formError} />}
        <AuthSubmitButton pending={isSubmitting} pendingText="Signing in...">
          Sign in
        </AuthSubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
