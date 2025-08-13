import request from "supertest";
import express from "express";
import routes from "../src/routes.js";

test("health", async () => {
  const app = express();
  app.use("/api", routes);
  const res = await request(app).get("/api/health");
  expect(res.statusCode).toBe(200);
  expect(res.body.ok).toBe(true);
});
