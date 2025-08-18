import { Router } from "express";
const r = Router();

r.get("/health", (_req, res) => res.json({ ok: true, service: "api", ts: Date.now() }));

r.get("/greet/:name", (req, res) => {
  res.json({ message: `Hello, ${req.params.name}! 😁👋🏾` });
});

export default r;
