// backend/src/server.js
require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const { connect } = require("./db");
const recipesRoute = require("./routes/recipes");

const app = express();

// middlewares
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// hello route
app.get("/", (_req, res) => {
  res.json({ ok: true, message: "Recipes API up ✅" });
});

// DB health route
app.get("/health/db", async (_req, res) => {
  try {
    const db = await connect();
    const colls = await db.listCollections().toArray();
    res.json({
      ok: true,
      db: db.databaseName,
      collections: colls.map((c) => c.name),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// API routes
app.use("/api/recipes", recipesRoute);

// 404
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// error handler (last)
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API running at http://localhost:${PORT}`));
