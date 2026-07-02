import { readFileSync } from "fs";
import pg from "pg";

const sql = readFileSync(process.argv[2], "utf8");
const client = new pg.Client({ connectionString: process.env.PG_URL, ssl: { rejectUnauthorized: false } });
try {
  await client.connect();
  await client.query(sql);
  console.log("MIGRATION OK");
} catch (e) {
  console.error("MIGRATION FAILED:", e.message);
  process.exit(1);
} finally {
  await client.end();
}
