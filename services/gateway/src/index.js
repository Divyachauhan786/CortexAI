import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import proxy from "express-http-proxy";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 8000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "AI Workspace API Gateway is running",
  });
});

app.use(
  "/auth",
  proxy(process.env.AUTH_SERVICE)
);

app.use(
  "/chat",
  proxy(process.env.CHAT_SERVICE)
);

app.use(
  "/agent",
  proxy(process.env.AGENT_SERVICE)
);

app.use(
  "/billing",
  proxy(process.env.BILLING_SERVICE)
);

app.listen(PORT, () => {
  console.log(` Gateway running on http://localhost:${PORT}`);
});