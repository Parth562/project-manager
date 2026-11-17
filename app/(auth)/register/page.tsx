"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/auth-client";
import { ALLOWED_EMAIL_DOMAIN, registerSchema, roleValues } from "@/lib/validations/auth";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import AuthField from "@/components/auth/AuthField";
import AuthAlert from "@/components/auth/AuthAlert";
import AuthSubmitButton from "@/components/auth/AuthSubmitButton";
import { BriefcaseIcon, LockIcon, MailIcon, UserIcon } from "@/components/auth/icons";

type FieldName = "name" | "email" | "password" | "confirmPassword" | "role";
type FieldErrors = Partial<Record<FieldName, string>>;

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const result = registerSchema.safeParse({
      name,
      email,
      password,
      confirmPassword,
      role,
    });
    if (!result.success) {
      const errors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as FieldName;
        errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setIsSubmitting(true);

    await authClient.signUp.email(
      {
        name: result.data.name,
        email: result.data.email,
        password: result.data.password,
        role: result.data.role,
      },
      {
        onSuccess: () => {
          router.push("/dashboard");
          router.refresh();
        },
        onError: (ctx) => {
          setFormError(
            ctx.error.message ||
              "Could not create account. Please check your details and try again."
          );
          setIsSubmitting(false);
        },
      }
    );
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 shadow-lg">
      <h2 className="text-2xl font-bold text-slate-900">Create your account</h2>
      <p className="mt-1 text-sm text-slate-500">Join your project management workspace</p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
        <AuthField
          id="name"
          label="Name"
          type="text"
          autoComplete="name"
          placeholder="Your full name"
          icon={<UserIcon />}
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldErrors.name}
        />
        <AuthField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder={`yourname@${ALLOWED_EMAIL_DOMAIN}`}
          icon={<MailIcon />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
          hint={`Use your college email (@${ALLOWED_EMAIL_DOMAIN}).`}
        />
        <AuthField
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          icon={<LockIcon />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
        />
        <AuthField
          id="confirmPassword"
          label="Confirm Password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          icon={<LockIcon />}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={fieldErrors.confirmPassword}
        />
        <div>
          <label htmlFor="role" className="text-sm font-medium text-slate-700">
            Role
          </label>
          <div className="relative mt-1.5">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
              <BriefcaseIcon />
            </span>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              aria-invalid={fieldErrors.role ? true : undefined}
              className={`w-full appearance-none rounded-lg border bg-white py-2.5 pl-10 pr-9 text-sm text-slate-900 transition focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600 ${
                fieldErrors.role ? "border-red-400" : "border-slate-300"
              }`}
            >
              <option value="">Select a role</option>
              {roleValues.map((value) => (
                <option key={value} value={value}>
                  {ROLE_LABELS[value]}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </span>
          </div>
          {fieldErrors.role && <p className="mt-1.5 text-xs text-red-600">{fieldErrors.role}</p>}
        </div>
        {formError && <AuthAlert message={formError} />}
        <AuthSubmitButton pending={isSubmitting} pendingText="Creating account...">
          Create Account
        </AuthSubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
