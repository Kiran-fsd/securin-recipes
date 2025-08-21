const { MongoClient } = require("mongodb");

const url = process.env.MONGO_URL;           // from .env
const client = new MongoClient(url);

let _db;
async function connect() {
  if (!_db) {                                // connect once, reuse
    await client.connect();
    _db = client.db();                       // default DB from URL -> recipes_db
  }
  return _db;
}

module.exports = { connect };
