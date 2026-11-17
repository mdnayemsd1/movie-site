import { json, cookieHeader } from "../../_lib/auth.js";

export async function onRequestPost() {
  return new Response(
    JSON.stringify({ success: true }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": cookieHeader("", 0)
      }
    }
  );
}
