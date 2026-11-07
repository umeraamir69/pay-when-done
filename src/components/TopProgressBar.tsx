"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { subscribeTopProgress } from "@/lib/top-progress";

function TopProgressBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstNav = useRef(true);

  useEffect(() => subscribeTopProgress(setActive), []);

  useEffect(() => {
    if (firstNav.current) {
      firstNav.current = false;
      return;
    }
    setActive(true);
    if (navTimer.current) clearTimeout(navTimer.current);
    navTimer.current = setTimeout(() => setActive(false), 420);
    return () => {
      if (navTimer.current) clearTimeout(navTimer.current);
    };
  }, [pathname, searchParams]);

  useEffect(() => {
    if (active) {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setVisible(true);
      return;
    }
    hideTimer.current = setTimeout(() => setVisible(false), 280);
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [active]);

  return (
    <div
      className={`top-progress${visible ? " is-visible" : ""}${active ? " is-active" : ""}`}
      aria-hidden={!visible}
    >
      <div className="top-progress-bar" />
    </div>
  );
}

export function TopProgressBar() {
  return (
    <Suspense fallback={null}>
      <TopProgressBarInner />
    </Suspense>
  );
}
