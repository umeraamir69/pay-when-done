"use client";

import Image from "next/image";
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
import {
  PITCH_SEED,
  PITCH_SLIDES,
  writePitchModePreference,
  type PitchSlide,
} from "@/lib/pitch";
import { JOB_TEMPLATES } from "@/lib/templates";
import type { DashboardStats, Job } from "@/lib/types";

const ease = [0.22, 1, 0.36, 1] as const;
const EMPTY_JOBS: Job[] = [];

function findJobByTitle(jobs: Job[], title: string): Job | undefined {
  const needle = title.toLowerCase();
  return (
    jobs.find((j) => j.title.toLowerCase() === needle) ||
    jobs.find((j) => j.title.toLowerCase().includes(needle))
  );
}

function shortenId(id?: string | null) {
  if (!id) return "—";
  if (id.length <= 14) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

function resolveCtas(
  slide: PitchSlide,
  matchedJob: Job | undefined,
): PitchSlide["ctas"] {
  if (!slide.ctas?.length) return slide.ctas;
  if (!matchedJob || !slide.jobMatch) return slide.ctas;
  return slide.ctas.map((cta, i) => {
    if (i === 0 && cta.primary) {
      return { ...cta, href: `/jobs/${matchedJob.id}` };
    }
    return cta;
  });
}

export function PitchDeck() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const { data: session } = useSession();
  const [index, setIndex] = useState(0);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
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
    if (!session?.user) return;
    let cancelled = false;
    (async () => {
      try {
        const [jobsRes, statsRes] = await Promise.all([
          fetch("/api/jobs"),
          fetch("/api/admin/stats"),
        ]);
        if (jobsRes.ok) {
          const json = (await jobsRes.json()) as { jobs?: Job[] };
          if (!cancelled && json.jobs) setJobs(json.jobs);
        }
        if (statsRes.ok) {
          const json = (await statsRes.json()) as { stats?: DashboardStats };
          if (!cancelled && json.stats) setStats(json.stats);
        }
      } catch {
        /* keep static copy — do not invent metrics */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.user]);

  const signedIn = Boolean(session?.user);
  const liveJobs = signedIn ? jobs : EMPTY_JOBS;
  const liveStats = signedIn ? stats : null;

  const escrowJob = findJobByTitle(liveJobs, PITCH_SEED.escrowTitle);
  const paypalJob = findJobByTitle(liveJobs, PITCH_SEED.paypalTitle);
  const disputeJob = findJobByTitle(liveJobs, PITCH_SEED.disputeTitle);
  const milestoneJob = findJobByTitle(liveJobs, PITCH_SEED.milestoneTitle);

  const matchedJob =
    slide.dataKind === "job-escrow"
      ? escrowJob
      : slide.dataKind === "job-paypal"
        ? paypalJob
        : slide.dataKind === "job-dispute"
          ? disputeJob
          : undefined;

  const ctas = resolveCtas(slide, matchedJob);

  const toneClass =
    slide.tone === "dark"
      ? " pitch-slide--dark"
      : slide.tone === "accent"
        ? " pitch-slide--accent"
        : "";

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
            <span>{slide.eyebrow}</span>
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
            className={
              slide.dataKind === "founder"
                ? "pitch-slide pitch-slide--founder"
                : "pitch-slide"
            }
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
            {slide.dataKind === "founder" ? (
              <div className="pitch-founder">
                <div className="pitch-founder-photo-wrap">
                  <Image
                    src="/images/umer-aamir.jpg"
                    alt="Muhammad Umer Aamir"
                    width={320}
                    height={320}
                    className="pitch-founder-photo"
                    priority
                  />
                </div>
                <div className="pitch-founder-copy">
                  <p className="eyebrow pitch-eyebrow">{slide.eyebrow}</p>
                  <h1 className="pitch-title">{slide.title}</h1>
                  <p className="pitch-founder-role">
                    Founder · PayWhenDone builder
                  </p>
                  <p className="pitch-body">{slide.body}</p>
                </div>
              </div>
            ) : (
              <>
                <p className="eyebrow pitch-eyebrow">{slide.eyebrow}</p>
                <h1 className="pitch-title">{slide.title}</h1>
                <p className="pitch-body">{slide.body}</p>
              </>
            )}

            {slide.points?.length ? (
              <ul className="pitch-points">
                {slide.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            ) : null}

            {slide.dataKind === "templates" ? (
              <dl className="pitch-stats">
                <div>
                  <dt>Templates</dt>
                  <dd>{JOB_TEMPLATES.length}</dd>
                </div>
                <div>
                  <dt>Ask AI</dt>
                  <dd>Live</dd>
                </div>
                <div>
                  <dt>Categories</dt>
                  <dd>6</dd>
                </div>
                <div>
                  <dt>Prefill</dt>
                  <dd>/create</dd>
                </div>
              </dl>
            ) : null}

            {slide.dataKind === "jobs-list" ? (
              <dl className="pitch-stats">
                <div>
                  <dt>Seeded jobs</dt>
                  <dd>{liveJobs.length ? liveJobs.length : "12+"}</dd>
                </div>
                <div>
                  <dt>Active holds</dt>
                  <dd>
                    {liveStats
                      ? liveStats.activeEscrows
                      : signedIn
                        ? "…"
                        : "Sign in"}
                  </dd>
                </div>
                <div>
                  <dt>Disputed</dt>
                  <dd>
                    {liveStats
                      ? liveStats.disputed
                      : liveJobs.filter((j) => j.status === "disputed")
                          .length || "—"}
                  </dd>
                </div>
                <div>
                  <dt>Released</dt>
                  <dd>
                    {liveStats
                      ? formatMoney(liveStats.fundsReleased)
                      : "—"}
                  </dd>
                </div>
              </dl>
            ) : null}

            {slide.dataKind === "job-escrow" ? (
              <dl className="pitch-stats">
                <div>
                  <dt>Job</dt>
                  <dd className="pitch-stat-text">
                    {matchedJob?.title || PITCH_SEED.escrowTitle}
                  </dd>
                </div>
                <div>
                  <dt>Amount</dt>
                  <dd>
                    {matchedJob
                      ? formatMoney(matchedJob.amount)
                      : formatMoney(140)}
                  </dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd className="pitch-stat-text">
                    {matchedJob?.status || "ai_approved"}
                  </dd>
                </div>
                <div>
                  <dt>Muse</dt>
                  <dd>
                    {matchedJob?.aiVerdict
                      ? `${Math.round(matchedJob.aiVerdict.confidence * 100)}%`
                      : "86%"}
                  </dd>
                </div>
              </dl>
            ) : null}

            {slide.dataKind === "job-paypal" ? (
              <dl className="pitch-stats pitch-stats--ids">
                <div>
                  <dt>Job</dt>
                  <dd className="pitch-stat-text">
                    {paypalJob?.title || PITCH_SEED.paypalTitle}
                  </dd>
                </div>
                <div>
                  <dt>Capture</dt>
                  <dd className="pitch-stat-mono">
                    {shortenId(
                      paypalJob?.paypalCaptureId ||
                        paypalJob?.paypal?.captureId,
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Auth</dt>
                  <dd className="pitch-stat-mono">
                    {shortenId(
                      paypalJob?.paypalAuthorizationId ||
                        paypalJob?.paypal?.authorizationId,
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Payout</dt>
                  <dd className="pitch-stat-mono">
                    {shortenId(
                      paypalJob?.paypalPayoutBatchId ||
                        paypalJob?.paypal?.payoutBatchId,
                    )}
                  </dd>
                </div>
              </dl>
            ) : null}

            {slide.dataKind === "job-dispute" ? (
              <dl className="pitch-stats">
                <div>
                  <dt>Dispute</dt>
                  <dd className="pitch-stat-text">
                    {disputeJob?.title || PITCH_SEED.disputeTitle}
                  </dd>
                </div>
                <div>
                  <dt>Held</dt>
                  <dd>
                    {disputeJob
                      ? formatMoney(disputeJob.amount)
                      : formatMoney(220)}
                  </dd>
                </div>
                <div>
                  <dt>Notes</dt>
                  <dd>
                    {disputeJob?.disputes?.length || 2}
                  </dd>
                </div>
                <div>
                  <dt>Milestones</dt>
                  <dd>
                    {milestoneJob?.milestones?.length || 2}
                  </dd>
                </div>
              </dl>
            ) : null}

            {slide.dataKind === "admin" && liveStats ? (
              <dl className="pitch-stats">
                <div>
                  <dt>Jobs</dt>
                  <dd>{liveStats.totalJobs}</dd>
                </div>
                <div>
                  <dt>Active holds</dt>
                  <dd>{liveStats.activeEscrows}</dd>
                </div>
                <div>
                  <dt>Held</dt>
                  <dd>{formatMoney(liveStats.fundsHeld)}</dd>
                </div>
                <div>
                  <dt>Released</dt>
                  <dd>{formatMoney(liveStats.fundsReleased)}</dd>
                </div>
              </dl>
            ) : null}

            {slide.dataKind === "admin" && !liveStats ? (
              <p className="pitch-data-hint">
                {signedIn
                  ? "Loading admin KPIs…"
                  : "Sign in as umer@umer.com to load live admin KPIs."}
              </p>
            ) : null}

            {slide.dataKind === "account" ? (
              <dl className="pitch-stats">
                <div>
                  <dt>Session</dt>
                  <dd className="pitch-stat-text">
                    {signedIn ? "Signed in" : "Guest"}
                  </dd>
                </div>
                <div>
                  <dt>Demo</dt>
                  <dd className="pitch-stat-text">umer@umer.com</dd>
                </div>
                <div>
                  <dt>Passkeys</dt>
                  <dd className="pitch-stat-text">Optional</dd>
                </div>
                <div>
                  <dt>Auth</dt>
                  <dd className="pitch-stat-text">Email-first</dd>
                </div>
              </dl>
            ) : null}

            {(slide.dataKind === "job-escrow" ||
              slide.dataKind === "job-paypal" ||
              slide.dataKind === "job-dispute" ||
              slide.dataKind === "jobs-list") &&
            !signedIn ? (
              <p className="pitch-data-hint">
                Sign in as umer@umer.com to deep-link seeded jobs and live counts.
              </p>
            ) : null}

            {ctas?.length ? (
              <div className="cta-row pitch-ctas">
                {ctas.map((cta) => (
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
