require("dotenv").config();
const pool = require("./src/config/db");

const createTable = async () => {
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

    try {
        await pool.query(query);
        console.log("✅ hotels table created successfully!");
    } catch (error) {
        console.error("❌ Error creating table:", error.message);
    } finally {
        await pool.end();
        console.log("Database connection closed.");
    }
};

createTable();