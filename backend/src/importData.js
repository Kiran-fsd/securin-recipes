require("dotenv").config();
const { MongoClient } = require("mongodb");
const fs = require("fs");
const path = require("path");

// helper: turn "389 kcal", "48 g", 4.5, NaN, null -> number or null
function toNum(v) {
  if (v === null || v === undefined) return null;
  const n = parseFloat(String(v).replace(/[^\d.]/g, ""));
  return Number.isNaN(n) ? null : n;
}

(async () => {
  const client = new MongoClient(process.env.MONGO_URL);

  try {
    await client.connect();
    const db = client.db("recipes_db");
    const col = db.collection("recipes");

    // 1) read file as text + replace NaN with null (valid JSON)
    const filePath = path.join(__dirname, "..", "US_recipes.json");
    let rawText = fs.readFileSync(filePath, "utf8");
    rawText = rawText.replace(/NaN/g, "null");

    // 2) parse
    let data = JSON.parse(rawText);

    // 3) ensure it's an array
    const arr = Array.isArray(data) ? data : Object.values(data);

    // 4) map to required fields + numeric cleanup
    const docs = arr.map((r) => ({
      cuisine: r.cuisine ?? null,
      title: r.title ?? null,
      rating: toNum(r.rating),
      prep_time: toNum(r.prep_time),
      cook_time: toNum(r.cook_time),
      total_time: toNum(r.total_time),
      description: r.description ?? null,
      nutrients: r.nutrients
        ? {
            calories: toNum(r.nutrients.calories),
            carbohydrateContent: toNum(r.nutrients.carbohydrateContent),
            cholesterolContent: toNum(r.nutrients.cholesterolContent),
            fiberContent: toNum(r.nutrients.fiberContent),
            proteinContent: toNum(r.nutrients.proteinContent),
            saturatedFatContent: toNum(r.nutrients.saturatedFatContent),
            sodiumContent: toNum(r.nutrients.sodiumContent),
            sugarContent: toNum(r.nutrients.sugarContent),
            fatContent: toNum(r.nutrients.fatContent),
          }
        : null,
      serves: r.serves ?? null,
    }));

    // 5) write
    await col.deleteMany({});
    const result = await col.insertMany(docs);
    console.log(`✅ Imported ${result.insertedCount || docs.length} recipes`);
  } catch (e) {
    console.error("❌ Import failed:", e.message);
  } finally {
    await client.close();
  }
})();
