"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { writePitchModePreference } from "@/lib/pitch";

/**
 * Honors ?pitch=1 on any page that mounts SiteHeader — stores preference
 * and routes into /pitch for frictionless demo entry.
 */
export function PitchModeEntry() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("pitch") !== "1") return;
    writePitchModePreference(true);
    if (pathname === "/pitch") return;
    router.replace("/pitch");
  }, [pathname, router, searchParams]);

  return null;
}
