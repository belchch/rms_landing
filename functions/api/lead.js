const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 5;
const hits = new Map();

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function clientIp(request) {
  return (
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

function rateLimited(ip) {
  const now = Date.now();
  const bucket = hits.get(ip) || [];
  const recent = bucket.filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (rateLimited(clientIp(request))) {
    return json(429, { error: "Слишком много заявок. Подождите минуту." });
  }

  let body;
  try {
    body = await request.json();
  } catch (_) {
    return json(400, { error: "Некорректное тело запроса" });
  }

  if (String(body.company || "").trim()) {
    return json(200, { ok: true });
  }

  const name = String(body.name || "").trim();
  const contact = String(body.contact || "").trim();
  const comment = String(body.comment || "").trim();

  if (!name || name.length > 80) {
    return json(400, { error: "Укажите имя" });
  }
  if (!contact || contact.length > 80) {
    return json(400, { error: "Укажите телефон или Telegram" });
  }
  if (comment.length > 500) {
    return json(400, { error: "Комментарий слишком длинный" });
  }

  const token = env.TG_BOT_TOKEN;
  const chatId = env.TG_CHAT_ID;
  if (!token || !chatId) {
    return json(500, { error: "Сервис заявок не настроен" });
  }

  const lines = [
    "<b>Заявка на демонстрацию planbee</b>",
    "",
    `<b>Имя:</b> ${escapeHtml(name)}`,
    `<b>Контакт:</b> ${escapeHtml(contact)}`,
  ];
  if (comment) {
    lines.push(`<b>Комментарий:</b> ${escapeHtml(comment)}`);
  }

  const tgResponse = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: lines.join("\n"),
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    }
  );

  if (!tgResponse.ok) {
    return json(502, { error: "Не удалось доставить заявку" });
  }

  return json(200, { ok: true });
}

export async function onRequest(context) {
  if (context.request.method === "POST") {
    return onRequestPost(context);
  }
  return json(405, { error: "Method not allowed" });
}
