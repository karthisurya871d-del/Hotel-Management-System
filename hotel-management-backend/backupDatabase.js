require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("./src/config/db");

async function backup() {
    const backupDir = path.join(__dirname, "backups");
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFile = path.join(backupDir, `backup_before_phase4_5_${timestamp}.json`);

    const tables = [
        "hotels",
        "users",
        "password_reset_tokens",
        "amenities",
        "hotel_amenities",
        "hotel_images",
        "rooms",
        "room_images",
        "room_amenities"
    ];

    const data = {
        timestamp: new Date().toISOString(),
        tables: {}
    };

    const client = await pool.connect();
    try {
        for (const table of tables) {
            try {
                const res = await client.query(`SELECT * FROM ${table};`);
                data.tables[table] = res.rows;
                console.log(`Backed up ${table}: ${res.rows.length} rows`);
            } catch (e) {
                console.log(`Table ${table} might not exist or error: ${e.message}`);
                data.tables[table] = [];
            }
        }

        fs.writeFileSync(backupFile, JSON.stringify(data, null, 2), "utf8");
        console.log(`\n✅ Database backup created successfully at:\n${backupFile}`);
    } finally {
        client.release();
        await pool.end();
    }
}

backup().catch((err) => {
    console.error("❌ Backup failed:", err);
    process.exit(1);
});

