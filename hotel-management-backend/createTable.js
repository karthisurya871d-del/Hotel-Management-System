require("dotenv").config();
const pool = require("./src/config/db");

const initTable = async () => {
    const createQuery = `
        CREATE TABLE IF NOT EXISTS hotels (
            id SERIAL PRIMARY KEY,
            image VARCHAR(255),
            title VARCHAR(150) NOT NULL,
            description TEXT,
            location VARCHAR(255),
            latitude DECIMAL(10, 7),
            longitude DECIMAL(10, 7),
            price DECIMAL(10, 2) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    `;

    const alterQuery = `
        ALTER TABLE hotels ADD COLUMN IF NOT EXISTS location VARCHAR(255);
        ALTER TABLE hotels ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    `;

    await pool.query(createQuery);
    await pool.query(alterQuery);
    console.log("✅ hotels table verified/created successfully!");
};

if (require.main === module) {
    initTable()
        .then(() => pool.end())
        .then(() => console.log("Database connection closed."))
        .catch((error) => {
            console.error("❌ Error creating table:", error.message);
            process.exit(1);
        });
}

module.exports = { initTable };
