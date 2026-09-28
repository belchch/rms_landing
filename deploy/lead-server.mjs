// Node-адаптер для functions/api/lead.js на VPS: принимает запрос от Caddy,
// собирает Web API Request и отдаёт ответ обработчика. Запускается контейнером
// `lead` из rms_platform/deploy/docker-compose.yml; lead.js кладётся рядом как lead.mjs.
import { createServer } from "node:http";
import { onRequest } from "./lead.mjs";

const MAX_BODY_BYTES = 16 * 1024;
const port = Number(process.env.PORT || 8787);
const env = {
  TG_BOT_TOKEN: process.env.TG_BOT_TOKEN,
  TG_CHAT_ID: process.env.TG_CHAT_ID,
};

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      return null;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

createServer(async (req, res) => {
  try {
    const hasBody = req.method !== "GET" && req.method !== "HEAD";
    const body = hasBody ? await readBody(req) : undefined;
    if (body === null) {
      res.writeHead(413).end();
      return;
    }
    const request = new Request(`http://${req.headers.host}${req.url}`, {
      method: req.method,
      headers: req.headers,
      body,
    });
    const response = await onRequest({ request, env });
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error(error);
    res.writeHead(500).end();
  }
}).listen(port, () => console.log(`lead listening on :${port}`));
