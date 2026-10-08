require("dotenv").config();
const pool = require("./src/config/db");

const initTable = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS hotels (
            id SERIAL PRIMARY KEY,
            image VARCHAR(255),
            title VARCHAR(150) NOT NULL,
            description TEXT,
            latitude DECIMAL(10, 7),
            longitude DECIMAL(10, 7),
            price DECIMAL(10, 2) NOT NULL
        );
    `;

    await pool.query(query);
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