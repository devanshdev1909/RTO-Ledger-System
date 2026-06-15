const pool = require("../config/db");

class User {

    static async createUser(
        roleId,
        fullName,
        email,
        passwordHash,
        mobile
    ) {

        const result = await pool.query(
            `
            INSERT INTO users
            (
                role_id,
                full_name,
                email,
                password_hash,
                mobile
            )
            VALUES
            ($1,$2,$3,$4,$5)
            RETURNING *
            `,
            [
                roleId,
                fullName,
                email,
                passwordHash,
                mobile
            ]
        );

        return result.rows[0];
    }

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