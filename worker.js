import { onRequestPost } from "./functions/api/lead.js";

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/lead") {
      if (request.method !== "POST") {
        return json(405, { error: "Method not allowed" });
      }
      return onRequestPost({ request, env });
    }

    if (!env.ASSETS || typeof env.ASSETS.fetch !== "function") {
      return new Response("Static asset binding is unavailable", { status: 503 });
    }

    return env.ASSETS.fetch(request);
  },
};
