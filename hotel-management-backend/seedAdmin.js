require("dotenv").config();
const pool = require("./src/config/db");
const bcrypt = require("bcryptjs");

async function seedAdmin() {
    const email    = process.env.ADMIN_EMAIL    || "admin@stayora.com";
    const password = process.env.ADMIN_PASSWORD || "Admin@1234!";
    const fullName = process.env.ADMIN_NAME     || "STAYORA Admin";

    const existing = await pool.query("SELECT id FROM users WHERE email = $1;", [email]);
    if (existing.rows.length > 0) {
        console.log(`Admin already exists with email: ${email}`);
        await pool.end();
        return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query(
        `INSERT INTO users (full_name, email, password_hash, role, is_active)
         VALUES ($1, $2, $3, 'admin', true)
         RETURNING id, email, role;`,
        [fullName, email, passwordHash]
    );

    console.log("✅ Admin seeded successfully:");
    console.log(`   ID:    ${result.rows[0].id}`);
    console.log(`   Email: ${result.rows[0].email}`);
    console.log(`   Role:  ${result.rows[0].role}`);
    console.log("\n⚠️  Change the default password immediately in production!");
    await pool.end();
}

seedAdmin().catch((err) => {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
});

