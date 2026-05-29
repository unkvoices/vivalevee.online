const express = require("express");
const path = require("path");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// 1. SECURITY MIDDLEWARES
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://unpkg.com", "'unsafe-inline'"],
        styleSrc: [
          "'self'",
          "https://fonts.googleapis.com",
          "https://unpkg.com",
          "'unsafe-inline'",
        ],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://images.unsplash.com"],
        connectSrc: ["'self'"],
      },
    },
  }),
);

const allowedOrigins = ["http://localhost:3000", "https://vivalevee.online"];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Não permitido por CORS"));
      }
    },
  }),
);

const checkoutLimiter = rateLimit({
  windowMs: 15 * 1000,
  max: 5,
  message: { error: "Muitas tentativas de checkout. Aguarde alguns segundos." },
});

app.use(express.json());

// 2. ROTAS DA API (Agora na mesma pasta)
const paymentRoutes = require("./payment");
const downloadRoutes = require("./download");

app.use("/api/checkout", checkoutLimiter);
app.use("/api", paymentRoutes);
app.use("/api", downloadRoutes);

// 3. ARQUIVOS ESTÁTICOS E FALLBACK
// Como estamos em /backend, subimos um nível para acessar a raiz
app.use(express.static(path.join(__dirname, "..")));

app.get("/product", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "pages", "product.html"));
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});

app.listen(PORT, () => {
  console.log(`
    🚀 VIVA LEVE SERVER RUNNING (BACKEND MODE)
    --------------------------
    URL: http://localhost:${PORT}
    `);
});
