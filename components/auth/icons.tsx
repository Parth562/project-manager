// Inline stroke icons (lucide-style) so no icon package is needed.
import type { ReactNode } from "react";

type IconProps = { className?: string };

function Svg({ children, className = "h-4 w-4" }: IconProps & { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  );
}

export const LogoIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M12 2l8.66 5v10L12 22l-8.66-5V7z" />
    <path d="M12 8l3.46 2v4L12 16l-3.46-2v-4z" />
  </Svg>
);
export const MailIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7l9 6 9-6" />
  </Svg>
);
export const LockIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 018 0v4" />
  </Svg>
);
export const UserIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0116 0" />
  </Svg>
);
export const BriefcaseIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M3 13h18" />
  </Svg>
);
export const EyeIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);
export const EyeOffIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M10.6 5.1A10.7 10.7 0 0112 5c6.5 0 10 7 10 7a17 17 0 01-3.2 4.2M6.6 6.6A17 17 0 002 12s3.5 7 10 7a10 10 0 005.4-1.6M9.9 9.9a3 3 0 004.2 4.2M3 3l18 18" />
  </Svg>
);
export const AlertIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v4M12 16h.01" />
  </Svg>
);
export const ClipboardIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <rect x="5" y="4" width="14" height="17" rx="2" />
    <path d="M9 4h6v3H9zM9 12h6M9 16h4" />
  </Svg>
);
export const ShieldCheckIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
    <path d="M9 12l2 2 4-4" />
  </Svg>
);
export const UsersIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0113 0M16 4.5a3.5 3.5 0 010 7M18 14a5.5 5.5 0 013.5 6" />
  </Svg>
);
export const Spinner = ({ className = "h-4 w-4" }: IconProps) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className={`animate-spin ${className}`}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.25" />
    <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
  </svg>
);
