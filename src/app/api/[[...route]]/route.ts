import { Hono } from "hono";
import { handle } from "hono/vercel";

const app = new Hono().basePath("/api");

app.get("/health", (c) => {
  return c.json({
    ok: true,
    platform: "ebrain",
    architecture: "modular-monolith",
    timestamp: new Date().toISOString(),
  });
});

app.get("/modules", (c) => {
  return c.json({
    modules: [
      { id: "hisab", name: "Hisab-Kitab Ledger", status: "active" },
      { id: "blog", name: "SEO Blog Engine", status: "active" },
      { id: "tools", name: "Free Public Micro-Tools", status: "active" },
      { id: "profiles", name: "Public Profiles", status: "active" },
      { id: "marketplace", name: "Marketplace & Ads", status: "phase-2" },
      { id: "ai-hub", name: "AI Assistant Hub", status: "phase-3" },
    ],
  });
});

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
