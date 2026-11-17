import { json, requireAdmin } from "../../_lib/auth.js";

export async function onRequestDelete({ request, env, params }) {
  if (!(await requireAdmin(request, env))) {
    return json({ error: "অনুমতি নেই" }, 401);
  }

  const id = String(params.id || "");

  if (!id) {
    return json({ error: "ভিডিও ID পাওয়া যায়নি" }, 400);
  }

  try {
    const result = await env.DB.prepare(
      "DELETE FROM videos WHERE id = ?"
    ).bind(id).run();

    if (!result.meta.changes) {
      return json({ error: "ভিডিও পাওয়া যায়নি" }, 404);
    }

    return json({ success: true });
  } catch {
    return json({ error: "ভিডিও ডিলিট করা যায়নি" }, 500);
  }
}
