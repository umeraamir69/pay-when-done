"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  BackgroundAtmosphere,
  HeroStagePattern,
} from "@/components/BackgroundAtmosphere";
import { FadeIn, FadeItem, HeroPipeline, Stagger } from "@/components/Motion";

const ease = [0.22, 1, 0.36, 1] as const;

export default function HomePage() {
  const reduce = useReducedMotion();

  return (
    <div className="landing">
      <BackgroundAtmosphere variant="landing" />

      <section className="hero">
        <motion.div
          className="hero-copy"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0.2 : 0.6, ease }}
        >
          <p className="eyebrow">PayPal authorize · Muse AI verify · capture</p>
          <h1>PayWhenDone</h1>
          <p className="lede">
            Local gigs hired on Facebook, Nextdoor, or WhatsApp have no
            protection. Hold the PayPal payment until an AI agent confirms the
            work matches the brief — then release it.
          </p>
          <div className="cta-row">
            <Link href="/signup" className="btn-primary">
              Create account
            </Link>
            <Link href="/how-it-works" className="btn-ghost">
              See how it works
            </Link>
          </div>
        </motion.div>

        <motion.div
          className="hero-stage"
          aria-hidden="true"
          initial={
            reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 24 }
          }
          animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
          transition={{
            duration: reduce ? 0.2 : 0.7,
            delay: reduce ? 0 : 0.12,
            ease,
          }}
        >
          <HeroStagePattern />
          <div className="hero-stage-label">Live money flow</div>
          <HeroPipeline />
          <p className="hero-stage-copy">
            Funds stay authorized — not captured — until Muse says the job is
            done. Sign in with a passkey next time.
          </p>
        </motion.div>
      </section>

      <section className="section">
        <FadeIn>
          <p className="eyebrow">The problem</p>
          <h2>Trust breaks the moment you leave the marketplace</h2>
        </FadeIn>
        <Stagger className="split-grid">
          <FadeItem>
            <article className="story-block">
              <h3>Client risk</h3>
              <p>
                Pay a cleaner or handyman upfront from a chat thread. They ghost.
                There is no dispute button, no hold, no recourse.
              </p>
            </article>
          </FadeItem>
          <FadeItem>
            <article className="story-block">
              <h3>Worker risk</h3>
              <p>
                Finish the bathroom, send photos, wait for Venmo that never
                arrives. Your labor already left the building.
              </p>
            </article>
          </FadeItem>
        </Stagger>
      </section>

      <section className="section band">
        <FadeIn>
          <p className="eyebrow">Product</p>
          <h2>Four steps. One escrow.</h2>
        </FadeIn>
        <FadeIn delay={0.06}>
          <ol className="steps-rail">
            {[
              ["01 · Brief", "Write what “done” means in plain language."],
              ["02 · Hold", "Client authorizes PayPal — money held, not taken."],
              ["03 · Proof", "Worker uploads photos and notes against the brief."],
              [
                "04 · Release",
                "Muse AI verifies. Capture payment or void the hold.",
              ],
            ].map(([title, copy]) => (
              <li key={title}>
                <strong>{title}</strong>
                <span>{copy}</span>
              </li>
            ))}
          </ol>
        </FadeIn>
        <FadeIn delay={0.12}>
          <div className="cta-row" style={{ marginTop: "1.75rem" }}>
            <Link href="/create" className="btn-primary">
              Start a job
            </Link>
          </div>
        </FadeIn>
      </section>

      <section className="section">
        <FadeIn>
          <p className="eyebrow">Who it’s for</p>
          <h2>Everyday off-platform work</h2>
        </FadeIn>
        <Stagger className="audience-grid">
          {[
            ["Home services", "Cleaners, painters, handymen, landscapers"],
            ["Moving & labor", "Movers, furniture assembly, same-day help"],
            ["Teaching", "Tutors, coaches, lesson packages"],
            ["Creatives", "Photographers, editors, event helpers"],
          ].map(([title, copy]) => (
            <FadeItem key={title}>
              <article>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            </FadeItem>
          ))}
        </Stagger>
      </section>

      <section className="section band-dark">
        <FadeIn>
          <p className="eyebrow light">Stack</p>
          <h2>Built on real rails</h2>
        </FadeIn>
        <Stagger className="stack-row">
          {[
            [
              "PayPal sandbox",
              "Orders, invoices, payouts, refunds, webhooks — authorize & capture escrow.",
            ],
            [
              "Muse AI",
              "Meta Muse Spark reads proof photos and notes, then gates the money action.",
            ],
            [
              "Passkeys + Prisma",
              "SQLite locally (Neon Postgres in prod). Sign in with Face ID every time.",
            ],
          ].map(([title, copy]) => (
            <FadeItem key={title}>
              <div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
            </FadeItem>
          ))}
        </Stagger>
      </section>

      <section className="section cta-finale">
        <FadeIn>
          <p className="eyebrow">Ready</p>
          <h2>Protect the next gig you hire — or finish.</h2>
          <p className="lede narrow">
            Create an account, add a passkey, hold funds, upload proof, let Muse
            decide.
          </p>
          <div className="cta-row">
            <Link href="/signup" className="btn-primary">
              Get started
            </Link>
            <Link href="/login" className="btn-ghost">
              Passkey sign in
            </Link>
          </div>
        </FadeIn>
      </section>
    </div>
  );
}
