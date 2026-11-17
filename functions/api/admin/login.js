import { json, createSession, cookieHeader } from "../../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const password = String(body.password || "");

    if (!env.ADMIN_PASSWORD || password !== env.ADMIN_PASSWORD) {
      return json({ error: "ভুল পাসওয়ার্ড" }, 401);
    }

    const token = await createSession(env);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": cookieHeader(token)
        }
      }
    );
  } catch {
    return json({ error: "লগইন করা যায়নি" }, 500);
  }
        }
