import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
});

const migrationsDir = path.join(
  process.cwd(),
  "migrations",
);

async function migrate() {
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename TEXT UNIQUE NOT NULL,
        executed_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    const files = (await fs.readdir(migrationsDir))
      .filter((file) => file.endsWith(".sql"))
      .sort();

    const { rows: executed } = await client.query(
      "SELECT filename FROM schema_migrations ORDER BY filename",
    );

    const executedFiles = new Set(
      executed.map((row) => row.filename),
    );

    for (const file of files) {
      if (executedFiles.has(file)) {
        console.log(`Skipping ${file}`);
        continue;
      }

      const filePath = path.join(migrationsDir, file);
      const sql = await fs.readFile(filePath, "utf8");

      console.log(`Running ${file}...`);

      await client.query("BEGIN");

      try {
        // One migration file can contain multiple SQL statements.
        await client.query(sql);

        await client.query(
          "INSERT INTO schema_migrations (filename) VALUES ($1)",
          [file],
        );

        await client.query("COMMIT");

        console.log(`Completed ${file}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }

    console.log("Migrations completed.");
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});