require("dotenv").config();
const express      = require("express");
const cors         = require("cors");
const path         = require("path");
const cookieParser = require("cookie-parser");

const hotelRoutes = require("./routes/hotelRoutes");
const authRoutes  = require("./routes/authRoutes");
const userRoutes  = require("./routes/userRoutes");
const ownerRoutes = require("./routes/ownerRoutes");
const adminRoutes = require("./routes/adminRoutes");
const errorHandler = require("./middleware/errorMiddleware");

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173,http://localhost:3000")
    .split(",")
    .map(o => o.trim().replace(/\/$/, ""))
    .filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const cleanOrigin = origin.replace(/\/$/, "");
        if (
            allowedOrigins.includes(cleanOrigin) ||
            allowedOrigins.includes("*") ||
            cleanOrigin.endsWith(".onrender.com")
        ) {
            return callback(null, true);
        }
        callback(new Error(`CORS: origin '${origin}' not allowed.`));
    },
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
    res.json({ message: "STAYORA API — Phase 1/2/3", version: "3.0.0" });
});

app.use("/api/hotels", hotelRoutes);
app.use("/api/auth",   authRoutes);
app.use("/api/users",  userRoutes);
app.use("/api/owner",  ownerRoutes);
app.use("/api/admin",  adminRoutes);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found.`
    });
});

app.use(errorHandler);

module.exports = app;
