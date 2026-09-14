function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(normalized);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function decodeJson(value) {
  return JSON.parse(new TextDecoder().decode(decodeBase64Url(value)));
}

function includesAudience(audience, expected) {
  return Array.isArray(audience) ? audience.includes(expected) : audience === expected;
}

export async function requireAccess(request, env) {
  if (!env.TEAM_DOMAIN || !env.POLICY_AUD) return { ok: false, status: 503, error: "Zugriffsschutz ist noch nicht vollständig eingerichtet." };
  const token = request.headers.get("cf-access-jwt-assertion");
  if (!token) return { ok: false, status: 403, error: "Cloudflare-Access-Anmeldung erforderlich." };

  try {
    const parts = token.split(".");
    if (parts.length !== 3) throw new Error("invalid token");
    const header = decodeJson(parts[0]);
    const payload = decodeJson(parts[1]);
    if (header.alg !== "RS256" || typeof header.kid !== "string") throw new Error("invalid algorithm");
    const issuer = env.TEAM_DOMAIN.replace(/\/$/, "");
    const now = Math.floor(Date.now() / 1000);
    if (payload.iss !== issuer || !includesAudience(payload.aud, env.POLICY_AUD) || Number(payload.exp) <= now || Number(payload.nbf || 0) > now) throw new Error("invalid claims");

    const response = await fetch(`${issuer}/cdn-cgi/access/certs`, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("certificates unavailable");
    const jwks = await response.json();
    const key = Array.isArray(jwks.keys) ? jwks.keys.find((candidate) => candidate.kid === header.kid) : undefined;
    if (!key) throw new Error("unknown key");
    const publicKey = await crypto.subtle.importKey("jwk", key, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    const valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", publicKey, decodeBase64Url(parts[2]), new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
    if (!valid) throw new Error("invalid signature");
    return { ok: true, email: typeof payload.email === "string" ? payload.email : "" };
  } catch (error) {
    console.error(JSON.stringify({ message: "access token rejected", error: error instanceof Error ? error.message : String(error) }));
    return { ok: false, status: 403, error: "Ungültige oder abgelaufene Anmeldung." };
  }
}
