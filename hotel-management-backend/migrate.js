require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("./src/config/db");

async function runMigration() {
    const sqlPath = path.join(__dirname, "migrations", "001_phase2_phase3.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    const client = await pool.connect();
    try {
        console.log("Running Phase 2 & 3 migration...");
        await client.query(sql);
        console.log("✅ Migration completed successfully!");
        console.log("   - users table created");
        console.log("   - password_reset_tokens table created");
        console.log("   - hotels table altered (owner_id, approval_status, etc.)");
        console.log("   - amenities, hotel_amenities, hotel_images created");
        console.log("   - rooms, room_images, room_amenities created");

        const hotelCheck = await client.query("SELECT COUNT(*) FROM hotels;");
        const legacyCheck = await client.query(
            "SELECT id, title, approval_status, owner_id FROM hotels WHERE id = 1;"
        );
        console.log(`\n📊 Hotels in DB: ${hotelCheck.rows[0].count}`);
        if (legacyCheck.rows[0]) {
            const r = legacyCheck.rows[0];
            console.log(`   Legacy record id=1: title="${r.title}", approval_status="${r.approval_status}", owner_id=${r.owner_id}`);
        }
    } catch (err) {
        console.error("❌ Migration failed:", err.message);
        throw err;
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration().catch(() => process.exit(1));

