const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;

let poolConfig;

if (connectionString) {
    const isLocalhost = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");
    poolConfig = {
        connectionString,
        ssl: isLocalhost ? false : { rejectUnauthorized: false }
    };
} else {
    poolConfig = {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false
    };
}

const pool = new Pool(poolConfig);

pool.on("connect", () => {
    console.log("PostgreSQL connected successfully");
});

pool.on("error", (err) => {
    console.error("PostgreSQL connection error:", err);
});

module.exports = pool;