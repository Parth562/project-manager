"use client";

import type { ButtonHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";
import Button from "@/components/ui/Button";

export default function SubmitButton({
  pendingText,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { pendingText: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending ? pendingText : children}
    </Button>
  );
}
