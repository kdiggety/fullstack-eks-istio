import express from "express";
import client from "prom-client";
import routes from "./routes.js";

const app = express();
app.use(express.json());
app.use("/api", routes);

// Prometheus metrics
const register = new client.Registry();
client.collectDefaultMetrics({ register });
app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API listening on :${port}`));
