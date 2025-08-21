const express = require("express");
const { connect } = require("../db");

const router = express.Router();

// escape regex specials for safe partial matching
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// turn "<=400", ">=4.5", "=120" into Mongo filter
function numFilter(input) {
  if (input == null || input === "") return null;
  const s = String(input).trim();
  const op = s.match(/^(<=|>=|<|>|=)/)?.[0] || "=";
  const raw = s.replace(/^(<=|>=|<|>|=)/, "");
  const val = parseFloat(raw);
  if (Number.isNaN(val)) return null;
  const map = { "<": "$lt", "<=": "$lte", ">": "$gt", ">=": "$gte", "=": "$eq" };
  return { [map[op]]: val };
}

// GET /api/recipes?page=1&limit=10 (sorted by rating desc)
router.get("/", async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
    const skip = (page - 1) * limit;

    const db = await connect();
    const col = db.collection("recipes");

    const [data, total] = await Promise.all([
      col.find({}).sort({ rating: -1 }).skip(skip).limit(limit).toArray(),
      col.countDocuments(),
    ]);

    res.json({ page, limit, total, data });
  } catch (e) {
    next(e);
  }
});

// GET /api/recipes/search?calories=<=400&title=pie&cuisine=Mexican&total_time=<=120&rating=>=4.5
router.get("/search", async (req, res, next) => {
  try {
    const { calories, title, cuisine, total_time, rating } = req.query;

    const q = {};
    if (title) q.title = { $regex: String(title), $options: "i" };     // partial, case-insensitive

    if (cuisine) {
      // partial, case-insensitive cuisine match
      q.cuisine = { $regex: escapeRegex(cuisine), $options: "i" };
    }

    const calF = numFilter(calories);
    const ttF = numFilter(total_time);
    const rateF = numFilter(rating);
    if (calF) q["nutrients.calories"] = calF;
    if (ttF) q.total_time = ttF;
    if (rateF) q.rating = rateF;

    const db = await connect();
    const col = db.collection("recipes");
    const data = await col.find(q).sort({ rating: -1 }).limit(200).toArray();

    res.json({ data });
  } catch (e) {
    next(e);
  }
});

// helper: list distinct cuisines
router.get("/cuisines", async (_req, res, next) => {
  try {
    const db = await connect();
    const col = db.collection("recipes");
    const cuisines = await col.distinct("cuisine");
    res.json({ cuisines: cuisines.filter(Boolean).sort() });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
