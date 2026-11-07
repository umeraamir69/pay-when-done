import type { Metadata } from "next";
import Link from "next/link";
import { SwaggerUI } from "@/components/SwaggerUI";

export const metadata: Metadata = {
  title: "Swagger / OpenAPI",
  description: "Interactive PayWhenDone API documentation",
};

export default function SwaggerDocsPage() {
  return (
    <div className="page-shell wide swagger-page">
      <p className="eyebrow">Docs</p>
      <h1>Swagger</h1>
      <p className="lede narrow">
        Interactive OpenAPI 3.1 docs. Spec also available as JSON at{" "}
        <Link href="/api/openapi">
          <code>/api/openapi</code>
        </Link>
        .
      </p>
      <div className="cta-row" style={{ marginBottom: "1rem" }}>
        <Link href="/docs/api" className="btn-ghost">
          Table reference
        </Link>
        <Link href="/docs" className="btn-ghost">
          Docs home
        </Link>
        <a href="/api/openapi" className="btn-primary">
          OpenAPI JSON
        </a>
      </div>
      <div className="swagger-frame panel">
        <SwaggerUI specUrl="/api/openapi" />
      </div>
    </div>
  );
}
