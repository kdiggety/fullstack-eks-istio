const { Router } = require("express");
const requireIdToken = require("./auth/verifyIdToken");
const { getGreeting, setGreeting } = require("./greeting-service");

// If you're on Node 18+, global fetch exists and you can delete the next line.
// Otherwise: npm i node-fetch@2  (CommonJS compatible)
let fetch;
try {
  // Prefer global if available (Node 18+)
  // eslint-disable-next-line no-undef
  fetch = global.fetch || require("node-fetch");
} catch {
  fetch = require("node-fetch");
}

const r = Router();

/**
 * Health (public)
 * NOTE: returns {status:"ok"} to match your earlier expectations.
 */
r.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

/**
 * Secure ping (requires a valid Google ID token in Authorization: Bearer …)
 */
r.get("/secure/ping", requireIdToken, (req, res) => {
  // req.user should be set by requireIdToken after verification
  const { sub, email, aud, iss } = req.user || {};
  res.json({ ok: true, user: { sub, email, aud, iss } });
});

/**
 * --- OIDC Authorization Code + PKCE callback (public) ---
 * Frontend posts: { code, code_verifier, redirect_uri, client_id }
 * We exchange with Google and return tokens (id_token, access_token, …)
 */
r.post("/auth/callback", async (req, res) => {
  try {
    const { code, code_verifier, redirect_uri, client_id } = req.body || {};

    if (!code || !code_verifier || !redirect_uri || !client_id) {
      return res.status(400).json({
        error: "invalid_request",
        error_description:
          "Required fields: code, code_verifier, redirect_uri, client_id",
      });
    }

    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      code_verifier,
      redirect_uri,
      client_id,
    });

    const resp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const json = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      // Pass through Google error status/details (helps diagnostics)
      return res.status(resp.status).json(json);
    }

    // json contains: access_token, id_token, expires_in, token_type, scope, …
    return res.json(json);
  } catch (err) {
    // Avoid leaking stack traces
    return res.status(500).json({ error: "server_error", message: err.message });
  }
});

/**
 * Simple greet echo (public)
 */
r.get("/greet/:name", (req, res) => {
  res.json({ message: `Hello, ${req.params.name}! 😁👋🏾` });
});

/**
 * Get greeting by id (public)
 */
r.get("/greeting/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const greeting = await getGreeting(id);
    if (greeting == null) {
      return res
        .status(404)
        .json({ ok: false, message: "greeting not found", id });
    }
    res.json({ ok: true, id, greeting });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * Set/overwrite greeting (public)
 */
r.post("/greeting/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { greeting, ttl } = req.body || {};
    if (greeting == null) {
      return res
        .status(400)
        .json({ ok: false, message: "`greeting` is required in body" });
    }
    await setGreeting(id, greeting, ttl);
    res.status(201).json({ ok: true, id, greeting, ttl: ttl ?? null });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = r;
