const request = require("supertest");
const express = require("express");
const routes = require("../src/routes");

function makeApp() {
  const app = express();
  app.use(express.json());      // harmless for GET; good default
  app.use("/api", routes);
  return app;
}

test("health", async () => {
  const app = makeApp();
  const res = await request(app).get("/api/health");
  expect(res.statusCode).toBe(200);
  expect(res.body).toEqual({ status: "ok" });
});
