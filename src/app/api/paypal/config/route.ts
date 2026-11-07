import { NextResponse } from "next/server";
import { getPublicClientId, isPayPalMock } from "@/lib/paypal";

export async function GET() {
  return NextResponse.json({
    clientId: getPublicClientId(),
    mock: isPayPalMock(),
    currency: "USD",
  });
}
