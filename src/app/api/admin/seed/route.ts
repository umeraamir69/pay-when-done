import { NextResponse } from "next/server";
import { requireAdminSession, forbidden } from "@/lib/api-auth";
import { seedDemoJobs } from "@/lib/store";

export async function POST(request: Request) {
  const admin = await requireAdminSession();
  if (admin.error) return admin.error;

  // Extra gate in production: require matching ADMIN_SEED_KEY header.
  if (process.env.VERCEL === "1" || process.env.NODE_ENV === "production") {
    const expected = process.env.ADMIN_SEED_KEY?.trim();
    if (!expected) {
      return forbidden("Demo seed is disabled in production");
    }
    const provided = request.headers.get("x-admin-seed-key") || "";
    if (provided !== expected) {
      return forbidden("Invalid seed key");
    }
  }

  const jobs = await seedDemoJobs(admin.session!.user.id);
  const owned = jobs.filter((job) => job.ownerId === admin.session!.user.id);
  return NextResponse.json({
    ok: true,
    count: owned.length,
    total: jobs.length,
  });
}
