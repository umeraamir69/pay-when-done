import type { Metadata } from "next";
import { PitchDeck } from "@/components/PitchDeck";

export const metadata: Metadata = {
  title: "Pitch",
  description:
    "Full PayWhenDone pitch: problem → signup → create → hold → proof → Muse → release → payout → disputes → admin → close.",
  robots: { index: false, follow: false },
};

export default function PitchPage() {
  return <PitchDeck />;
}
