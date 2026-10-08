require("dotenv").config();
const app = require("./app");
const pool = require("./config/db");
const { initTable } = require("../createTable");

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    try {
        await pool.query("SELECT NOW()");
        console.log("Database connection successful");
        await initTable();
    } catch (error) {
        console.error("Database connection failed:", error.message);
    }
});