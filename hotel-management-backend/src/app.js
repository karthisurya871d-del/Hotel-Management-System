const express = require("express");
const cors = require("cors");
const path = require("path");

const hotelRoutes = require("./routes/hotelRoutes");
const errorHandler = require("./middleware/errorMiddleware");

const app = express();

app.use(cors());
app.use(express.json());

// Serve uploaded images as static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Welcome route
app.get("/", (req, res) => {
    res.json({ message: "Welcome to Hotel Management System API" });
});

// Hotel routes
app.use("/api/hotels", hotelRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found.`
    });
});

// Global error handler
app.use(errorHandler);

module.exports = app;