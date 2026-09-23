"use client";

import type { ButtonHTMLAttributes } from "react";
import Button from "@/components/ui/Button";

export default function ConfirmSubmitButton({
  confirmMessage,
  onClick,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { confirmMessage: string }) {
  return (
    <Button
      type="submit"
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
        onClick?.(event);
      }}
      {...props}
    />
  );
}
