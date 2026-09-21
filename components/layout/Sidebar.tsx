"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";
import { NAV_ACCESS } from "@/lib/auth/permissions";

export default function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = NAV_ACCESS.filter((item) => item.roles.includes(role));

  return (
    <aside className="hidden md:flex md:w-56 md:flex-col md:border-r md:border-gray-200 md:bg-white">
      <nav className="flex flex-1 flex-col gap-1 p-4">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-gray-900 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
