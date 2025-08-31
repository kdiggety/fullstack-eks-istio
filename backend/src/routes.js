import { Router } from "express";
import { getGreeting, setGreeting } from "./greeting-service.js";

const r = Router();

r.get("/health", (_req, res) => res.json({ ok: true, service: "api", ts: Date.now() }));

r.get("/greet/:name", (req, res) => {
  res.json({ message: `Hello, ${req.params.name}! 😁👋🏾` });
});

r.get("/greeting/:name/:id", (req, res) => {
  const greeting = getGreeting(req.params.id);
  res.json({ message: greeting });
});

r.post("/greet/:id", (req, res) => {
  setGreeting(req.params.id, req.body);
  res.json({ message: `Set ${id} greeting to ${req.body}` });
});

export default r;
