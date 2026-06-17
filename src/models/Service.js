const pool = require("../config/db");

class Service {
    static async getActiveServices() {
        const result = await pool.query('SELECT * FROM services WHERE is_active = true ORDER BY service_name ASC');
        return result.rows;
    }

    static async getAll() {
        const result = await pool.query('SELECT * FROM services ORDER BY service_name ASC');
        return result.rows;
    }
}

module.exports = Service;
