const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    console.log("Creating user_permissions table if not exists...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_permissions (
        user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
        permission_id BIGINT REFERENCES permissions(id) ON DELETE CASCADE,
        PRIMARY KEY (user_id, permission_id)
      )
    `);

    console.log("Pre-seeding user_permissions with default role permissions...");
    await client.query(`
      INSERT INTO user_permissions (user_id, permission_id)
      SELECT u.id, rp.permission_id
      FROM users u
      JOIN role_permissions rp ON u.role_id = rp.role_id
      ON CONFLICT DO NOTHING
    `);

    await client.query("COMMIT");
    console.log("Migration successful!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
