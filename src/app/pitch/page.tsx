import type { Metadata } from "next";
import { PitchDeck } from "@/components/PitchDeck";

export const metadata: Metadata = {
  title: "Pitch",
  description:
    "Guided PayWhenDone pitch: problem, escrow solution, live product beats, and tech stack.",
  robots: { index: false, follow: false },
};

export default function PitchPage() {
  return <PitchDeck />;
}
