"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    SwaggerUIBundle?: {
      (options: Record<string, unknown>): unknown;
      presets?: { apis: unknown };
      plugins?: { DownloadUrl: unknown };
    };
    SwaggerUIStandalonePreset?: unknown;
  }
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

function loadCss(href: string) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

export function SwaggerUI({ specUrl }: { specUrl: string }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function mount() {
      loadCss("https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css");
      await loadScript(
        "https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js",
      );
      await loadScript(
        "https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-standalone-preset.js",
      );
      if (cancelled || !hostRef.current || !window.SwaggerUIBundle) return;

      hostRef.current.innerHTML = "";
      window.SwaggerUIBundle({
        url: specUrl,
        domNode: hostRef.current,
        deepLinking: true,
        docExpansion: "list",
        defaultModelsExpandDepth: 1,
        tryItOutEnabled: true,
        persistAuthorization: true,
        presets: [
          window.SwaggerUIBundle.presets?.apis,
          window.SwaggerUIStandalonePreset,
        ].filter(Boolean),
        layout: "StandaloneLayout",
      });
    }

    mount().catch((error) => {
      if (hostRef.current) {
        hostRef.current.textContent =
          error instanceof Error ? error.message : "Failed to load Swagger UI";
      }
    });

    return () => {
      cancelled = true;
    };
  }, [specUrl]);

  return <div ref={hostRef} className="swagger-host" />;
}
