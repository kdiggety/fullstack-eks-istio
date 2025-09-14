const ISS_PRIMARY = process.env.OIDC_ISSUER_PRIMARY || "https://accounts.google.com";
const ISS_ALT     = process.env.OIDC_ISSUER_ALT     || "accounts.google.com";
const AUDIENCE    = process.env.OIDC_AUDIENCE; // your Google client ID

// Google's JWKS endpoint
const GOOGLE_JWKS_URL = new URL("https://www.googleapis.com/oauth2/v3/certs");

function isAllowedIssuer(iss) {
  return iss === ISS_PRIMARY || iss === ISS_ALT;
}

async function verifyIdToken(token) {
  const { createRemoteJWKSet, jwtVerify } = await import("jose");
  const JWKS = createRemoteJWKSet(GOOGLE_JWKS_URL);

  const { payload } = await jwtVerify(token, JWKS, {
    audience: AUDIENCE,
    // We’ll check issuer manually so we accept either primary or alt
    issuer: undefined,
  });
  if (!isAllowedIssuer(payload.iss)) {
    throw new Error(`Bad issuer: ${payload.iss}`);
  }
  return payload;
}

// Express middleware
module.exports = async function requireIdToken(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const [, raw] = auth.split(" ");
    if (!raw) return res.status(401).json({ error: "missing bearer token" });
    const claims = await verifyIdToken(raw);
    // attach useful fields
    req.user = {
      sub: claims.sub,
      email: claims.email,
      email_verified: claims.email_verified,
      hd: claims.hd,
      iss: claims.iss,
      aud: claims.aud,
    };
    next();
  } catch (err) {
    res.status(401).json({ error: "invalid token", detail: err.message });
  }
};
