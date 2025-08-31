const request = require('supertest');
const express = require('express');
const routes = require('../src/routes');  // drop `.js` if in CJS

test("health", async () => {
  const app = express();
  app.use("/api", routes);
  const res = await request(app).get("/api/health");
  expect(res.statusCode).toBe(200);
  expect(res.body.ok).toBe(true);
});
