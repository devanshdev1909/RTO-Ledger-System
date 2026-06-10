const pool = require("../config/db");

class User {



    static async findByEmail(email) {

        const result = await pool.query(
           `
            SELECT
                u.*,
                r.name AS role_name
            FROM users u
            JOIN roles r
            ON u.role_id = r.id
            WHERE u.email = $1
            `,
            [email]
        );

        return result.rows[0];
    }

}

module.exports = User;