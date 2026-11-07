import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Ship seeded SQLite DB into serverless functions (Vercel /tmp copy at runtime).
  outputFileTracingIncludes: {
    "/api/**/*": ["./prisma/**/*.db", "./prisma/schema.prisma"],
    "/*": ["./prisma/**/*.db", "./prisma/schema.prisma"],
  },
};

export default nextConfig;
