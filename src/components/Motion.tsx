"use client";

import {
  motion,
  useReducedMotion,
  type HTMLMotionProps,
} from "framer-motion";
import { ReactNode } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease },
  },
};

const fadeUpReduced = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.2 },
  },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const staggerReduced = {
  hidden: {},
  show: { transition: { staggerChildren: 0 } },
};

export function FadeIn({
  children,
  delay = 0,
  className,
  ...rest
}: HTMLMotionProps<"div"> & { delay?: number; children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18 }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        duration: reduce ? 0.2 : 0.55,
        ease,
        delay: reduce ? 0 : delay,
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={reduce ? staggerReduced : stagger}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
    >
      {children}
    </motion.div>
  );
}

export function FadeItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={reduce ? fadeUpReduced : fadeUp}
    >
      {children}
    </motion.div>
  );
}

export function PageTransition({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0.15 : 0.35, ease }}
    >
      {children}
    </motion.div>
  );
}

const PIPELINE = ["Hold", "Prove", "Verify", "Pay"] as const;

/** Gentle sequential reveal for the hero money-flow labels */
export function HeroPipeline() {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className="hero-pipeline"
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: reduce ? 0 : 0.14,
            delayChildren: reduce ? 0 : 0.35,
          },
        },
      }}
    >
      {PIPELINE.map((label, i) => (
        <span key={label} className="hero-pipeline-step">
          <motion.span
            className={i === PIPELINE.length - 1 ? "accent" : undefined}
            variants={{
              hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 10 },
              show: {
                opacity: 1,
                y: 0,
                transition: { duration: reduce ? 0.15 : 0.45, ease },
              },
            }}
          >
            {label}
          </motion.span>
          {i < PIPELINE.length - 1 ? (
            <motion.i
              aria-hidden
              variants={{
                hidden: { scaleX: 0, opacity: 0 },
                show: {
                  scaleX: 1,
                  opacity: 1,
                  transition: {
                    duration: reduce ? 0.1 : 0.4,
                    ease,
                  },
                },
              }}
            />
          ) : null}
        </span>
      ))}
    </motion.div>
  );
}
