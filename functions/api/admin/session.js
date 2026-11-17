import { json, requireAdmin } from "../../_lib/auth.js";

export async function onRequestGet({ request, env }) {
  const authenticated = await requireAdmin(request, env);

  return json({
    authenticated
  });
}
