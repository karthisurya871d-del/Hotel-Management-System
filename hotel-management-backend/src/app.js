const express = require("express");
const cors = require("cors");
const path = require("path");
const hotelRoutes = require("./routes/hotelRoutes");
const errorHandler = require("./middleware/errorMiddleware");
const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.get("/", (req, res) => {
    res.json({ message: "Welcome to Hotel Management System API" });
});
app.use("/api/hotels", hotelRoutes);
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found.`
    });
});
app.use(errorHandler);
module.exports = app;