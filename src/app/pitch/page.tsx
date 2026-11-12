import type { Metadata } from "next";
import { PitchDeck } from "@/components/PitchDeck";

export const metadata: Metadata = {
  title: "Pitch",
  description:
    "Guided PayWhenDone pitch: About me → landing → templates → create → jobs → escrow → PayPal → disputes → admin → account → close.",
  robots: { index: false, follow: false },
};

export default function PitchPage() {
  return <PitchDeck />;
}
