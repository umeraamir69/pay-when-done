import Link from "next/link";
import type { Metadata } from "next";
import { API_ROUTES } from "@/lib/api-catalog";

export const metadata: Metadata = { title: "API" };

export default function ApiDocPage() {
  return (
    <div className="page-shell wide">
      <p className="eyebrow">Docs</p>
      <h1>API reference</h1>
      <p className="lede narrow">
        REST surface used by the UI. Prefer{" "}
        <Link href="/docs/swagger">Swagger UI</Link> for interactive docs. Also
        in <code>docs/API.md</code> and <code>/api/openapi</code>.
      </p>

      <div className="table-wrap panel" style={{ marginTop: "1.25rem" }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Method</th>
              <th>Path</th>
              <th>Purpose</th>
            </tr>
          </thead>
          <tbody>
            {API_ROUTES.map((route) => (
              <tr key={`${route.method}-${route.path}`}>
                <td>
                  <code>{route.method}</code>
                </td>
                <td>
                  <code>{route.path}</code>
                </td>
                <td>{route.purpose}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="cta-row">
        <Link href="/docs" className="btn-ghost">
          Docs home
        </Link>
        <Link href="/docs/swagger" className="btn-primary">
          Open Swagger
        </Link>
        <a href="/api/openapi" className="btn-ghost">
          OpenAPI JSON
        </a>
      </div>
    </div>
  );
}
