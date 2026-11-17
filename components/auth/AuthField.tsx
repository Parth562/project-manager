"use client";

import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { EyeIcon, EyeOffIcon } from "@/components/auth/icons";

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  icon: ReactNode;
  error?: string;
  hint?: string;
};

export const authInputClass =
  "w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600";

// Labelled input with an icon prefix; password inputs get a show/hide toggle.
export default function AuthField({ id, label, icon, error, hint, type, ...props }: AuthFieldProps) {
  const isPassword = type === "password";
  const [visible, setVisible] = useState(false);
  const helpId = error || hint ? `${id}-help` : undefined;

  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative mt-1.5">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
          {icon}
        </span>
        <input
          id={id}
          type={isPassword && visible ? "text" : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={helpId}
          className={`${authInputClass} ${isPassword ? "pr-10" : "pr-3"} ${
            error ? "border-red-400" : ""
          }`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 flex items-center rounded-r-lg px-3 text-slate-400 transition hover:text-slate-700 focus:text-indigo-600 focus:outline-none"
          >
            {visible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>
      {error ? (
        <p id={helpId} className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={helpId} className="mt-1.5 text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
