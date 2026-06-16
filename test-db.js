require('dotenv').config();
const pool = require('./src/config/db');

async function test() {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        
        const roleId = 1; // Assuming role 1 exists
        console.log("Deleting old permissions...");
        await client.query("DELETE FROM role_permissions WHERE role_id = $1", [roleId]);
        
        console.log("Inserting new permissions...");
        const permissions = ['1', '2'];
        for (const p_id of permissions) {
            await client.query(
                "INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)",
                [roleId, p_id]
            );
        }
        
        await client.query("ROLLBACK"); // Don't actually change the DB
        console.log("Success");
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Error:", err);
    } finally {
        client.release();
        pool.end();
    }
}

test();
