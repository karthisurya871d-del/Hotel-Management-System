const pool = require("../config/db");
const fs = require("fs");
const path = require("path");

const validateHotelInput = ({ title, price, latitude, longitude }) => {
    const errors = [];

    if (!title || String(title).trim() === "") {
        errors.push("title is required and cannot be empty.");
    }

    if (price === undefined || price === null || String(price).trim() === "") {
        errors.push("price is required.");
    } else if (isNaN(price) || Number(price) <= 0) {
        errors.push("price must be a positive number.");
    }

    if (latitude !== undefined && latitude !== null && latitude !== "") {
        if (isNaN(latitude)) errors.push("latitude must be a valid number.");
    }

    if (longitude !== undefined && longitude !== null && longitude !== "") {
        if (isNaN(longitude)) errors.push("longitude must be a valid number.");
    }

    return errors;
};

// POST /api/hotels — Create a new hotel
const createHotel = async (req, res) => {
    try {
        const { title, description, latitude, longitude, price } = req.body;

        // Image comes from multer as req.file
        const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

        const errors = validateHotelInput({ title, price, latitude, longitude });
        if (errors.length > 0) {
            // Remove uploaded file if validation fails
            if (req.file) {
                fs.unlink(req.file.path, () => {});
            }
            return res.status(400).json({ success: false, message: "Validation failed.", errors });
        }

        const query = `
            INSERT INTO hotels (image, title, description, latitude, longitude, price)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `;
        const values = [
            imagePath,
            String(title).trim(),
            description || null,
            latitude !== undefined && latitude !== "" ? Number(latitude) : null,
            longitude !== undefined && longitude !== "" ? Number(longitude) : null,
            Number(price)
        ];

        const result = await pool.query(query, values);
        return res.status(201).json({
            success: true,
            message: "Hotel created successfully.",
            data: result.rows[0]
        });
    } catch (error) {
        console.error("createHotel error:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error.", error: error.message });
    }
};

// GET /api/hotels — Get all hotels with search, price filter, pagination
const getAllHotels = async (req, res) => {
    try {
        const { search, minPrice, maxPrice, page = 1, limit = 10 } = req.query;

        const conditions = [];
        const values = [];
        let idx = 1;

        if (search && search.trim() !== "") {
            conditions.push(`title ILIKE $${idx++}`);
            values.push(`%${search.trim()}%`);
        }

        if (minPrice !== undefined && minPrice !== "") {
            if (isNaN(minPrice) || Number(minPrice) < 0) {
                return res.status(400).json({ success: false, message: "minPrice must be a non-negative number." });
            }
            conditions.push(`price >= $${idx++}`);
            values.push(Number(minPrice));
        }

        if (maxPrice !== undefined && maxPrice !== "") {
            if (isNaN(maxPrice) || Number(maxPrice) < 0) {
                return res.status(400).json({ success: false, message: "maxPrice must be a non-negative number." });
            }
            conditions.push(`price <= $${idx++}`);
            values.push(Number(maxPrice));
        }

        const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

        // Count total matching rows for pagination
        const countResult = await pool.query(
            `SELECT COUNT(*) FROM hotels ${where};`,
            values
        );
        const total = parseInt(countResult.rows[0].count, 10);

        // Pagination
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
        const offset = (pageNum - 1) * limitNum;
        const totalPages = Math.ceil(total / limitNum);

        const dataValues = [...values, limitNum, offset];
        const dataQuery = `
            SELECT * FROM hotels ${where}
            ORDER BY id ASC
            LIMIT $${idx++} OFFSET $${idx++};
        `;

        const result = await pool.query(dataQuery, dataValues);

        return res.status(200).json({
            success: true,
            message: "Hotels fetched successfully.",
            total,
            page: pageNum,
            totalPages,
            count: result.rowCount,
            data: result.rows
        });
    } catch (error) {
        console.error("getAllHotels error:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error.", error: error.message });
    }
};

// GET /api/hotels/:id — Get hotel by ID
const getHotelById = async (req, res) => {
    try {
        const { id } = req.params;

        if (isNaN(id) || Number(id) <= 0) {
            return res.status(400).json({ success: false, message: "Invalid hotel ID." });
        }

        const result = await pool.query(`SELECT * FROM hotels WHERE id = $1;`, [Number(id)]);

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: `Hotel with ID ${id} not found.` });
        }

        return res.status(200).json({ success: true, message: "Hotel fetched successfully.", data: result.rows[0] });
    } catch (error) {
        console.error("getHotelById error:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error.", error: error.message });
    }
};

// PUT /api/hotels/:id — Update hotel by ID
const updateHotel = async (req, res) => {
    try {
        const { id } = req.params;

        if (isNaN(id) || Number(id) <= 0) {
            return res.status(400).json({ success: false, message: "Invalid hotel ID." });
        }

        const checkResult = await pool.query(`SELECT * FROM hotels WHERE id = $1;`, [Number(id)]);

        if (checkResult.rowCount === 0) {
            if (req.file) fs.unlink(req.file.path, () => {});
            return res.status(404).json({ success: false, message: `Hotel with ID ${id} not found.` });
        }

        const existing = checkResult.rows[0];
        const { title, description, latitude, longitude, price } = req.body;

        // If a new file was uploaded, delete the old one
        let updatedImage = existing.image;
        if (req.file) {
            updatedImage = `/uploads/${req.file.filename}`;
            if (existing.image) {
                const oldPath = path.join(__dirname, "..", existing.image);
                fs.unlink(oldPath, () => {});
            }
        }

        const updatedTitle       = title       !== undefined ? String(title).trim() : existing.title;
        const updatedDescription = description !== undefined ? description           : existing.description;
        const updatedLatitude    = (latitude   !== undefined && latitude  !== "") ? Number(latitude)  : existing.latitude;
        const updatedLongitude   = (longitude  !== undefined && longitude !== "") ? Number(longitude) : existing.longitude;
        const updatedPrice       = price       !== undefined ? price                 : existing.price;

        const errors = validateHotelInput({
            title: updatedTitle,
            price: updatedPrice,
            latitude: updatedLatitude,
            longitude: updatedLongitude
        });

        if (errors.length > 0) {
            return res.status(400).json({ success: false, message: "Validation failed.", errors });
        }

        const query = `
            UPDATE hotels
            SET image = $1, title = $2, description = $3, latitude = $4, longitude = $5, price = $6
            WHERE id = $7
            RETURNING *;
        `;
        const values = [
            updatedImage,
            updatedTitle,
            updatedDescription,
            updatedLatitude,
            updatedLongitude,
            Number(updatedPrice),
            Number(id)
        ];

        const result = await pool.query(query, values);
        return res.status(200).json({ success: true, message: "Hotel updated successfully.", data: result.rows[0] });
    } catch (error) {
        console.error("updateHotel error:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error.", error: error.message });
    }
};

// DELETE /api/hotels/:id — Delete hotel by ID
const deleteHotel = async (req, res) => {
    try {
        const { id } = req.params;

        if (isNaN(id) || Number(id) <= 0) {
            return res.status(400).json({ success: false, message: "Invalid hotel ID." });
        }

        const result = await pool.query(`DELETE FROM hotels WHERE id = $1 RETURNING *;`, [Number(id)]);

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: `Hotel with ID ${id} not found.` });
        }

        // Delete the associated image file if it exists
        const deleted = result.rows[0];
        if (deleted.image) {
            const imgPath = path.join(__dirname, "..", deleted.image);
            fs.unlink(imgPath, () => {});
        }

        return res.status(200).json({ success: true, message: `Hotel deleted successfully.`, data: deleted });
    } catch (error) {
        console.error("deleteHotel error:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error.", error: error.message });
    }
};

module.exports = { createHotel, getAllHotels, getHotelById, updateHotel, deleteHotel };
