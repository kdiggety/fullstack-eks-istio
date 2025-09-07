// src/routes.js (CommonJS)
const { Router } = require('express');
const { getGreeting, setGreeting } = require('./greeting-service');
const jwt = require('jsonwebtoken');

const r = Router();

const requireJwt = (req, res, next) => {
  const hdr = req.headers.authorization || '';
  const m = hdr.match(/^Bearer (.+)$/);
  if (!m) return res.status(401).json({ error: 'missing bearer token' });
  try {
    req.user = jwt.verify(m[1], process.env.JWT_SECRET); // uses your K8s secret
    return next();
  } catch (e) {
    return res.status(401).json({ error: 'invalid token' });
  }
};

// Health check
r.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'api', ts: Date.now() });
});

r.get('/secure/ping', requireJwt, (req, res) => {
  res.json({ ok: true, user: { sub: req.user.sub } });
});

// Simple greet echo
r.get('/greet/:name', (req, res) => {
  res.json({ message: `Hello, ${req.params.name}! 😁👋🏾` });
});

// Get greeting by id
r.get('/greeting/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const greeting = await getGreeting(id);
    if (greeting == null) {
      return res.status(404).json({ ok: false, message: 'greeting not found', id });
    }
    res.json({ ok: true, id, greeting });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Set/overwrite greeting
r.post('/greeting/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { greeting, ttl } = req.body || {};
    if (greeting == null) {
      return res.status(400).json({ ok: false, message: '`greeting` is required in body' });
    }
    await setGreeting(id, greeting, ttl);
    res.status(201).json({ ok: true, id, greeting, ttl: ttl ?? null });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = r;
