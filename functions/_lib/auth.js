const encoder = new TextEncoder();

function toBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64Url(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - base64.length % 4) % 4);
  return Uint8Array.from(atob(padded), c => c.charCodeAt(0));
}

async function getKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" }
  });
}

export async function createSession(env) {
  const payload = {
    admin: true,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000
  };

  const encoded = toBase64Url(
    encoder.encode(JSON.stringify(payload))
  );

  const key = await getKey(env.ADMIN_SECRET);
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(encoded)
  );

  return encoded + "." + toBase64Url(new Uint8Array(signature));
}

export async function verifySession(token, env) {
  try {
    if (!token || !env.ADMIN_SECRET) return false;

    const parts = token.split(".");
    if (parts.length !== 2) return false;

    const key = await getKey(env.ADMIN_SECRET);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      fromBase64Url(parts[1]),
      encoder.encode(parts[0])
    );

    if (!valid) return false;

    const payload = JSON.parse(
      new TextDecoder().decode(fromBase64Url(parts[0]))
    );

    return payload.admin === true && payload.exp > Date.now();
  } catch {
    return false;
  }
}

export function cookieHeader(token, maxAge = 604800) {
  return `nebula_admin=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
}

export async function requireAdmin(request, env) {
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/(?:^|;\s*)nebula_admin=([^;]+)/);

  if (!match) return false;

  return await verifySession(match[1], env);
    }
