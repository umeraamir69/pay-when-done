/**
 * OpenAPI 3.1 specification for PayWhenDone REST API.
 * Served at GET /api/openapi — rendered by /docs/swagger.
 */

export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "PayWhenDone API",
    version: "0.2.0",
    description:
      "AI escrow API: hold funds with PayPal AUTHORIZE, verify proof with Muse, capture/payout on release. Most job and admin routes require a Better Auth session cookie.",
    contact: { name: "PayWhenDone" },
  },
  servers: [
    { url: "https://pay-when-done.vercel.app", description: "Production" },
    { url: "http://localhost:3000", description: "Local" },
  ],
  tags: [
    { name: "Health", description: "Liveness / readiness" },
    { name: "Auth", description: "Better Auth (email + passkeys)" },
    { name: "Jobs", description: "Escrow job lifecycle" },
    { name: "PayPal", description: "Public PayPal client config" },
    { name: "Webhooks", description: "PayPal webhook ingest (signature required)" },
    { name: "Admin", description: "Dashboard KPIs and ledger" },
    { name: "Notifications", description: "Activity feed" },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "better-auth.session_token",
        description: "Better Auth session cookie set after /login or /signup",
      },
      adminSeedKey: {
        type: "apiKey",
        in: "header",
        name: "x-admin-seed-key",
        description: "Required for POST /api/admin/seed in production",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: { type: "string" },
        },
        required: ["error"],
      },
      JobStatus: {
        type: "string",
        enum: [
          "draft",
          "awaiting_payment",
          "funded",
          "proof_submitted",
          "ai_approved",
          "ai_rejected",
          "disputed",
          "released",
          "refunded",
          "voided",
        ],
      },
      CreateJobRequest: {
        type: "object",
        required: [
          "title",
          "brief",
          "amount",
          "clientName",
          "workerName",
          "workerEmail",
        ],
        properties: {
          title: { type: "string", example: "Bathroom clean" },
          brief: {
            type: "string",
            example: "Clean shower and floor. Photos required.",
          },
          amount: { type: "number", exclusiveMinimum: 0, example: 85 },
          currency: { type: "string", default: "USD" },
          category: {
            type: "string",
            enum: [
              "cleaning",
              "moving",
              "tutoring",
              "handyman",
              "creative",
              "other",
            ],
          },
          priority: { type: "string", enum: ["low", "normal", "high"] },
          tags: { type: "array", items: { type: "string" } },
          clientName: { type: "string" },
          workerName: { type: "string" },
          workerEmail: { type: "string", format: "email" },
          dueAt: { type: "string", format: "date-time" },
          autoPayoutOnRelease: { type: "boolean", default: true },
          createInvoiceOnFund: { type: "boolean", default: false },
        },
      },
      Job: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          brief: { type: "string" },
          amount: { type: "number" },
          currency: { type: "string" },
          status: { $ref: "#/components/schemas/JobStatus" },
          clientName: { type: "string" },
          workerName: { type: "string" },
          workerEmail: { type: "string" },
          ownerId: { type: "string" },
          paypalOrderId: { type: "string" },
          paypalAuthorizationId: { type: "string" },
          paypalCaptureId: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      ProofRequest: {
        type: "object",
        required: ["proofNotes", "proofImageDataUrl"],
        properties: {
          proofNotes: { type: "string" },
          proofImageDataUrl: {
            type: "string",
            description: "data:image/*;base64,... (max ~2.5MB)",
          },
        },
      },
      MilestoneCreate: {
        type: "object",
        required: ["title", "amount"],
        properties: {
          title: { type: "string" },
          amount: { type: "number" },
          dueAt: { type: "string", format: "date-time" },
        },
      },
      MilestonePatch: {
        type: "object",
        required: ["milestoneId", "status"],
        properties: {
          milestoneId: { type: "string" },
          status: {
            type: "string",
            enum: ["pending", "funded", "completed", "paid"],
          },
        },
      },
      DisputeRequest: {
        type: "object",
        required: ["body"],
        properties: {
          body: { type: "string" },
          author: { type: "string", enum: ["client", "worker", "admin"] },
          authorName: { type: "string" },
        },
      },
      NotesRequest: {
        type: "object",
        properties: {
          internalNotes: { type: "string" },
        },
      },
      RateRequest: {
        type: "object",
        required: ["rating"],
        properties: {
          rating: { type: "integer", minimum: 1, maximum: 5 },
        },
      },
      HealthResponse: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
          status: { type: "string", enum: ["healthy", "degraded"] },
        },
      },
      PayPalConfig: {
        type: "object",
        properties: {
          clientId: { type: "string" },
          mock: { type: "boolean" },
          currency: { type: "string" },
        },
      },
    },
    parameters: {
      JobId: {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string" },
        description: "Job id",
      },
    },
    responses: {
      Unauthorized: {
        description: "Missing or invalid session",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
      Forbidden: {
        description: "Not allowed for this resource",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
      NotFound: {
        description: "Resource not found",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
    },
  },
  paths: {
    "/api/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        operationId: "getHealth",
        security: [],
        responses: {
          "200": {
            description: "Service status",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HealthResponse" },
              },
            },
          },
        },
      },
    },
    "/api/auth/{path}": {
      get: {
        tags: ["Auth"],
        summary: "Better Auth handler",
        description: "Delegates to Better Auth (session, passkeys, etc.).",
        operationId: "authGet",
        parameters: [
          {
            name: "path",
            in: "path",
            required: true,
            schema: { type: "string" },
            example: "get-session",
          },
        ],
        responses: { "200": { description: "Auth response" } },
      },
      post: {
        tags: ["Auth"],
        summary: "Better Auth handler",
        operationId: "authPost",
        parameters: [
          {
            name: "path",
            in: "path",
            required: true,
            schema: { type: "string" },
            example: "sign-in/email",
          },
        ],
        responses: { "200": { description: "Auth response" } },
      },
    },
    "/api/jobs": {
      get: {
        tags: ["Jobs"],
        summary: "List owned jobs",
        operationId: "listJobs",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "status",
            in: "query",
            schema: { $ref: "#/components/schemas/JobStatus" },
          },
          { name: "q", in: "query", schema: { type: "string" } },
          { name: "category", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Job list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    jobs: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Job" },
                    },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
      post: {
        tags: ["Jobs"],
        summary: "Create escrow job",
        operationId: "createJob",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateJobRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { job: { $ref: "#/components/schemas/Job" } },
                },
              },
            },
          },
          "400": {
            description: "Validation error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/jobs/export": {
      get: {
        tags: ["Jobs"],
        summary: "Export jobs as CSV",
        operationId: "exportJobs",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "CSV file",
            content: { "text/csv": { schema: { type: "string" } } },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/jobs/{id}": {
      get: {
        tags: ["Jobs"],
        summary: "Get one job",
        operationId: "getJob",
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/JobId" }],
        responses: {
          "200": {
            description: "Job",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { job: { $ref: "#/components/schemas/Job" } },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/jobs/{id}/create-order": {
      post: {
        tags: ["Jobs"],
        summary: "Create PayPal AUTHORIZE order",
        operationId: "createOrder",
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/JobId" }],
        responses: {
          "200": { description: "Order created" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/jobs/{id}/authorize": {
      post: {
        tags: ["Jobs"],
        summary: "Authorize payment hold (+ optional invoice)",
        operationId: "authorizeJob",
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/JobId" }],
        responses: {
          "200": { description: "Funds held" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/jobs/{id}/proof": {
      post: {
        tags: ["Jobs"],
        summary: "Submit worker proof",
        operationId: "submitProof",
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/JobId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ProofRequest" },
            },
          },
        },
        responses: {
          "200": { description: "Proof saved" },
          "400": {
            description: "Invalid proof",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/jobs/{id}/verify": {
      post: {
        tags: ["Jobs"],
        summary: "Run Muse AI verification on proof",
        operationId: "verifyProof",
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/JobId" }],
        responses: {
          "200": { description: "AI verdict applied" },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/jobs/{id}/release": {
      post: {
        tags: ["Jobs"],
        summary: "Capture authorization (+ optional worker payout)",
        operationId: "releasePayment",
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/JobId" }],
        responses: {
          "200": { description: "Payment released" },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/jobs/{id}/void": {
      post: {
        tags: ["Jobs"],
        summary: "Void authorization",
        operationId: "voidAuthorization",
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/JobId" }],
        responses: {
          "200": { description: "Authorization voided" },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/jobs/{id}/refund": {
      post: {
        tags: ["Jobs"],
        summary: "Refund captured payment",
        operationId: "refundCapture",
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/JobId" }],
        responses: {
          "200": { description: "Refunded" },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/jobs/{id}/invoice": {
      post: {
        tags: ["Jobs"],
        summary: "Create and send PayPal invoice",
        operationId: "createInvoice",
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/JobId" }],
        responses: {
          "200": { description: "Invoice sent" },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/jobs/{id}/payout": {
      post: {
        tags: ["Jobs"],
        summary: "Payout to worker PayPal",
        operationId: "payoutWorker",
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/JobId" }],
        responses: {
          "200": { description: "Payout batch created" },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/jobs/{id}/sync": {
      post: {
        tags: ["Jobs"],
        summary: "Sync PayPal state into DB",
        operationId: "syncPayPal",
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/JobId" }],
        responses: {
          "200": { description: "Synced" },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/jobs/{id}/dispute": {
      post: {
        tags: ["Jobs"],
        summary: "Add dispute message",
        operationId: "addDispute",
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/JobId" }],
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/DisputeRequest" },
            },
          },
        },
        responses: {
          "200": { description: "Dispute updated" },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/jobs/{id}/milestones": {
      post: {
        tags: ["Jobs"],
        summary: "Add milestone",
        operationId: "addMilestone",
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/JobId" }],
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/MilestoneCreate" },
            },
          },
        },
        responses: {
          "200": { description: "Milestone added" },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
      patch: {
        tags: ["Jobs"],
        summary: "Update milestone status",
        operationId: "patchMilestone",
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/JobId" }],
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/MilestonePatch" },
            },
          },
        },
        responses: {
          "200": { description: "Milestone updated" },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/jobs/{id}/notes": {
      post: {
        tags: ["Jobs"],
        summary: "Save internal notes",
        operationId: "saveNotes",
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/JobId" }],
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/NotesRequest" },
            },
          },
        },
        responses: {
          "200": { description: "Notes saved" },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/jobs/{id}/duplicate": {
      post: {
        tags: ["Jobs"],
        summary: "Clone job as new escrow",
        operationId: "duplicateJob",
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/JobId" }],
        responses: {
          "201": { description: "Clone created" },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/jobs/{id}/rate": {
      post: {
        tags: ["Jobs"],
        summary: "Rate worker after release",
        operationId: "rateWorker",
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/JobId" }],
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RateRequest" },
            },
          },
        },
        responses: {
          "200": { description: "Rating saved" },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/paypal/config": {
      get: {
        tags: ["PayPal"],
        summary: "Public PayPal client config",
        operationId: "getPayPalConfig",
        security: [],
        responses: {
          "200": {
            description: "Client id + mock flag",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PayPalConfig" },
              },
            },
          },
        },
      },
    },
    "/api/webhooks/paypal": {
      post: {
        tags: ["Webhooks"],
        summary: "PayPal webhook ingest",
        description:
          "Requires valid PayPal transmission headers and PAYPAL_WEBHOOK_ID verification. Unsigned requests are rejected.",
        operationId: "paypalWebhook",
        security: [],
        parameters: [
          {
            name: "paypal-transmission-id",
            in: "header",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "paypal-transmission-sig",
            in: "header",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "paypal-transmission-time",
            in: "header",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "paypal-auth-algo",
            in: "header",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "paypal-cert-url",
            in: "header",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  event_type: { type: "string" },
                  resource: { type: "object", additionalProperties: true },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Accepted" },
          "401": { description: "Signature verification failed" },
          "503": { description: "Webhook ID not configured" },
        },
      },
    },
    "/api/admin/stats": {
      get: {
        tags: ["Admin"],
        summary: "Dashboard KPIs",
        operationId: "adminStats",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": { description: "Stats payload" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/api/admin/ledger": {
      get: {
        tags: ["Admin"],
        summary: "Ledger, invoices, payouts, webhooks",
        operationId: "adminLedger",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": { description: "Ledger bundle" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/api/admin/seed": {
      post: {
        tags: ["Admin"],
        summary: "Load demo dataset",
        description:
          "Disabled in production unless x-admin-seed-key matches ADMIN_SEED_KEY.",
        operationId: "adminSeed",
        security: [{ cookieAuth: [] }, { adminSeedKey: [] }],
        responses: {
          "200": { description: "Seeded" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/api/notifications": {
      get: {
        tags: ["Notifications"],
        summary: "Activity-derived notification feed",
        operationId: "listNotifications",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": { description: "Notifications" },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/openapi": {
      get: {
        tags: ["Health"],
        summary: "OpenAPI document (this spec)",
        operationId: "getOpenApi",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "OpenAPI 3.1 JSON",
            content: {
              "application/json": {
                schema: { type: "object", additionalProperties: true },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
  },
} as const;
