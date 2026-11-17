import { json, requireAdmin } from "../_lib/auth.js";

export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare(
      "SELECT id, title, url, created_at FROM videos ORDER BY created_at DESC"
    ).all();

    return json(results || []);
  } catch {
    return json({ error: "ভিডিও লোড করা যায়নি" }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  if (!(await requireAdmin(request, env))) {
    return json({ error: "অনুমতি নেই" }, 401);
  }

  try {
    const body = await request.json();
    const title = String(body.title || "").trim();
    const url = String(body.url || "").trim();

    if (!title || title.length > 120 || !url) {
      return json({ error: "সঠিক শিরোনাম ও URL দিন" }, 400);
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch {
      return json({ error: "সঠিক URL দিন" }, 400);
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return json({ error: "শুধু HTTP বা HTTPS URL গ্রহণযোগ্য" }, 400);
    }

    const id = crypto.randomUUID();

    await env.DB.prepare(
      "INSERT INTO videos (id, title, url) VALUES (?, ?, ?)"
    ).bind(id, title, url).run();

    return json({ id, title, url }, 201);
  } catch {
    return json({ error: "ভিডিও যোগ করা যায়নি" }, 500);
  }
}
