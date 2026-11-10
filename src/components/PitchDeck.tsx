"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { useSession } from "@/lib/auth-client";
import { formatMoney } from "@/lib/format";
import { PITCH_SLIDES, writePitchModePreference } from "@/lib/pitch";
import type { DashboardStats } from "@/lib/types";

const ease = [0.22, 1, 0.36, 1] as const;

export function PitchDeck() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const { data: session } = useSession();
  const [index, setIndex] = useState(0);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const total = PITCH_SLIDES.length;
  const slide = PITCH_SLIDES[index];
  const progress = ((index + 1) / total) * 100;

  const exitPitch = useCallback(() => {
    writePitchModePreference(false);
    router.push("/");
  }, [router]);

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  const goNext = useCallback(() => {
    setIndex((i) => Math.min(total - 1, i + 1));
  }, [total]);

  useEffect(() => {
    writePitchModePreference(true);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        exitPitch();
        return;
      }
      if (event.key === "ArrowRight" || event.key === " ") {
        event.preventDefault();
        goNext();
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [exitPitch, goNext, goPrev]);

  useEffect(() => {
    if (!session?.user) {
      setStats(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/stats");
        if (!res.ok) return;
        const json = (await res.json()) as { stats?: DashboardStats };
        if (!cancelled && json.stats) setStats(json.stats);
      } catch {
        /* keep static copy — do not invent metrics */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.user]);

  const toneClass =
    slide.tone === "dark"
      ? " pitch-slide--dark"
      : slide.tone === "accent"
        ? " pitch-slide--accent"
        : "";

  const showLiveStats = Boolean(stats) && slide.id === "admin";

  return (
    <div className="pitch-root" role="region" aria-label="Pitch mode">
      <header className="pitch-chrome">
        <Link
          href="/"
          className="pitch-brand"
          onClick={() => writePitchModePreference(false)}
        >
          <BrandMark size={28} />
        </Link>

        <nav className="pitch-progress" aria-label="Pitch progress">
          {PITCH_SLIDES.map((item, i) => (
            <button
              key={item.id}
              type="button"
              className={
                i === index
                  ? "pitch-dot is-active"
                  : i < index
                    ? "pitch-dot is-done"
                    : "pitch-dot"
              }
              aria-label={`Slide ${i + 1}: ${item.title}`}
              aria-current={i === index ? "step" : undefined}
              title={item.eyebrow}
              onClick={() => setIndex(i)}
            />
          ))}
        </nav>

        <div className="pitch-chrome-actions">
          <span className="pitch-step-label" aria-live="polite">
            {slide.eyebrow}
            <span className="pitch-step-count">
              {index + 1}/{total}
            </span>
          </span>
          <Link href="/admin" className="pitch-admin-link" title="Admin console">
            Admin
          </Link>
          <button type="button" className="pitch-exit" onClick={exitPitch}>
            Exit
            <kbd>Esc</kbd>
          </button>
        </div>

        <div
          className="pitch-progress-bar"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={index + 1}
          aria-label="Pitch progress"
        >
          <span style={{ width: `${progress}%` }} />
        </div>
      </header>

      <div className={`pitch-stage${toneClass}`}>
        <AnimatePresence mode="wait">
          <motion.article
            key={slide.id}
            className="pitch-slide"
            initial={
              reduce
                ? { opacity: 0 }
                : { opacity: 0, y: 18, filter: "blur(4px)" }
            }
            animate={
              reduce
                ? { opacity: 1 }
                : { opacity: 1, y: 0, filter: "blur(0px)" }
            }
            exit={
              reduce
                ? { opacity: 0 }
                : { opacity: 0, y: -12, filter: "blur(3px)" }
            }
            transition={{ duration: reduce ? 0.15 : 0.45, ease }}
          >
            <p className="eyebrow pitch-eyebrow">{slide.eyebrow}</p>
            <h1 className="pitch-title">{slide.title}</h1>
            <p className="pitch-body">{slide.body}</p>

            {slide.points?.length ? (
              <ul className="pitch-points">
                {slide.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            ) : null}

            {showLiveStats && stats ? (
              <dl className="pitch-stats">
                <div>
                  <dt>Jobs</dt>
                  <dd>{stats.totalJobs}</dd>
                </div>
                <div>
                  <dt>Active holds</dt>
                  <dd>{stats.activeEscrows}</dd>
                </div>
                <div>
                  <dt>Held</dt>
                  <dd>{formatMoney(stats.fundsHeld)}</dd>
                </div>
                <div>
                  <dt>Released</dt>
                  <dd>{formatMoney(stats.fundsReleased)}</dd>
                </div>
              </dl>
            ) : null}

            {slide.ctas?.length ? (
              <div className="cta-row pitch-ctas">
                {slide.ctas.map((cta) => (
                  <Link
                    key={cta.href + cta.label}
                    href={cta.href}
                    className={cta.primary ? "btn-primary" : "btn-ghost"}
                    {...(cta.href.startsWith("http")
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                  >
                    {cta.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </motion.article>
        </AnimatePresence>
      </div>

      <footer className="pitch-nav">
        <button
          type="button"
          className="btn-ghost pitch-nav-btn"
          onClick={goPrev}
          disabled={index === 0}
        >
          <kbd>←</kbd> Prev
        </button>
        <p className="pitch-hint">Arrow keys to move · Esc to exit</p>
        <button
          type="button"
          className={
            index === total - 1
              ? "btn-primary pitch-nav-btn"
              : "btn-ghost pitch-nav-btn"
          }
          onClick={index === total - 1 ? exitPitch : goNext}
        >
          {index === total - 1 ? (
            <>
              Finish <kbd>Esc</kbd>
            </>
          ) : (
            <>
              Next <kbd>→</kbd>
            </>
          )}
        </button>
      </footer>
    </div>
  );
}
