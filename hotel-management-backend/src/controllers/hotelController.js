const pool = require("../config/db");
const fs = require("fs");
const path = require("path");

const deleteFileSafely = async (filePath, maxRetries = 10) => {
    if (!filePath) return;
    for (let i = 0; i < maxRetries; i++) {
        try {
            if (!fs.existsSync(filePath)) return;
            fs.unlinkSync(filePath);
            return;
        } catch (err) {
            if ((err.code === "EBUSY" || err.code === "EPERM") && i < maxRetries - 1) {
                await new Promise((res) => setTimeout(res, 100));
            } else {
                return;
            }
        }
    }
};

const validateHotelInput = ({ title, location, price, latitude, longitude }) => {
    const errors = [];

    if (!title || String(title).trim() === "") {
        errors.push("title is required and cannot be empty.");
    } else if (String(title).trim().length > 150) {
        errors.push("title cannot exceed 150 characters.");
    }

    if (location !== undefined && location !== null && String(location).trim() === "") {
        errors.push("location cannot be empty if provided.");
    } else if (location && String(location).trim().length > 255) {
        errors.push("location cannot exceed 255 characters.");
    }

    if (price === undefined || price === null || String(price).trim() === "") {
        errors.push("price is required.");
    } else if (isNaN(price) || Number(price) <= 0) {
        errors.push("price must be a positive number.");
    }

    if (latitude !== undefined && latitude !== null && String(latitude).trim() !== "") {
        if (isNaN(latitude)) {
            errors.push("latitude must be a valid number.");
        } else {
            const lat = Number(latitude);
            if (lat < -90 || lat > 90) {
                errors.push("latitude must be between -90 and 90.");
            }
        }
    }

    if (longitude !== undefined && longitude !== null && String(longitude).trim() !== "") {
        if (isNaN(longitude)) {
            errors.push("longitude must be a valid number.");
        } else {
            const lng = Number(longitude);
            if (lng < -180 || lng > 180) {
                errors.push("longitude must be between -180 and 180.");
            }
        }
    }

    return errors;
};

const createHotel = async (req, res) => {
    try {
        const { title, description, location, latitude, longitude, price } = req.body;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Validation failed.",
                errors: ["image is required."]
            });
        }

        const errors = validateHotelInput({ title, location, price, latitude, longitude });
        if (errors.length > 0) {
            deleteFileSafely(req.file.path);
            return res.status(400).json({
                success: false,
                message: "Validation failed.",
                errors
            });
        }

        const imagePath = `/uploads/${req.file.filename}`;
        const query = `
            INSERT INTO hotels (image, title, description, location, latitude, longitude, price)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *;
        `;
        const values = [
            imagePath,
            String(title).trim(),
            description ? String(description).trim() : null,
            location ? String(location).trim() : null,
            latitude !== undefined && String(latitude).trim() !== "" ? Number(latitude) : null,
            longitude !== undefined && String(longitude).trim() !== "" ? Number(longitude) : null,
            Number(price)
        ];

        const result = await pool.query(query, values);
        return res.status(201).json({
            success: true,
            message: "Hotel created successfully.",
            data: result.rows[0]
        });
    } catch (error) {
        if (req.file) {
            await deleteFileSafely(req.file.path);
        }
        console.error("createHotel error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
            error: error.message
        });
    }
};

const getAllHotels = async (req, res) => {
    try {
        const { search, location, minPrice, maxPrice, page = 1, limit = 9 } = req.query;
        const conditions = [];
        const values = [];
        let idx = 1;

        if (minPrice !== undefined && String(minPrice).trim() !== "") {
            if (isNaN(minPrice) || Number(minPrice) < 0) {
                return res.status(400).json({
                    success: false,
                    message: "minPrice must be a non-negative number."
                });
            }
        }

        if (maxPrice !== undefined && String(maxPrice).trim() !== "") {
            if (isNaN(maxPrice) || Number(maxPrice) < 0) {
                return res.status(400).json({
                    success: false,
                    message: "maxPrice must be a non-negative number."
                });
            }
        }

        if (
            minPrice !== undefined && String(minPrice).trim() !== "" &&
            maxPrice !== undefined && String(maxPrice).trim() !== ""
        ) {
            if (Number(minPrice) > Number(maxPrice)) {
                return res.status(400).json({
                    success: false,
                    message: "minPrice cannot be greater than maxPrice."
                });
            }
        }

        if (search && search.trim() !== "") {
            conditions.push(`(title ILIKE $${idx} OR location ILIKE $${idx})`);
            values.push(`%${search.trim()}%`);
            idx++;
        }

        if (location && location.trim() !== "") {
            conditions.push(`location ILIKE $${idx++}`);
            values.push(`%${location.trim()}%`);
        }

        if (minPrice !== undefined && String(minPrice).trim() !== "") {
            conditions.push(`price >= $${idx++}`);
            values.push(Number(minPrice));
        }

        if (maxPrice !== undefined && String(maxPrice).trim() !== "") {
            conditions.push(`price <= $${idx++}`);
            values.push(Number(maxPrice));
        }

        const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

        const countResult = await pool.query(
            `SELECT COUNT(*) FROM hotels ${where};`,
            values
        );
        const total = parseInt(countResult.rows[0].count, 10);

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 9));
        const offset = (pageNum - 1) * limitNum;
        const totalPages = total > 0 ? Math.ceil(total / limitNum) : 0;

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
            limit: limitNum,
            count: result.rowCount,
            data: result.rows
        });
    } catch (error) {
        console.error("getAllHotels error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
            error: error.message
        });
    }
};

const getHotelById = async (req, res) => {
    try {
        const { id } = req.params;
        if (isNaN(id) || Number(id) <= 0 || !Number.isInteger(Number(id))) {
            return res.status(400).json({ success: false, message: "Invalid hotel ID." });
        }

        const result = await pool.query(`SELECT * FROM hotels WHERE id = $1;`, [Number(id)]);
        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: `Hotel with ID ${id} not found.` });
        }

        return res.status(200).json({
            success: true,
            message: "Hotel fetched successfully.",
            data: result.rows[0]
        });
    } catch (error) {
        console.error("getHotelById error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
            error: error.message
        });
    }
};

const updateHotel = async (req, res) => {
    try {
        const { id } = req.params;
        if (isNaN(id) || Number(id) <= 0 || !Number.isInteger(Number(id))) {
            if (req.file) deleteFileSafely(req.file.path);
            return res.status(400).json({ success: false, message: "Invalid hotel ID." });
        }

        const checkResult = await pool.query(`SELECT * FROM hotels WHERE id = $1;`, [Number(id)]);
        if (checkResult.rowCount === 0) {
            if (req.file) deleteFileSafely(req.file.path);
            return res.status(404).json({ success: false, message: `Hotel with ID ${id} not found.` });
        }

        const existing = checkResult.rows[0];
        const { title, description, location, latitude, longitude, price } = req.body;

        const updatedTitle = title !== undefined ? String(title).trim() : existing.title;
        const updatedLocation = location !== undefined ? String(location).trim() : existing.location;
        const updatedDescription = description !== undefined ? (description ? String(description).trim() : null) : existing.description;
        const updatedLatitude = (latitude !== undefined && String(latitude).trim() !== "") ? Number(latitude) : existing.latitude;
        const updatedLongitude = (longitude !== undefined && String(longitude).trim() !== "") ? Number(longitude) : existing.longitude;
        const updatedPrice = price !== undefined ? price : existing.price;

        const errors = validateHotelInput({
            title: updatedTitle,
            location: updatedLocation,
            price: updatedPrice,
            latitude: updatedLatitude,
            longitude: updatedLongitude
        });

        if (errors.length > 0) {
            if (req.file) await deleteFileSafely(req.file.path);
            return res.status(400).json({
                success: false,
                message: "Validation failed.",
                errors
            });
        }

        let updatedImage = existing.image;
        let newlyUploadedPath = null;
        if (req.file) {
            newlyUploadedPath = req.file.path;
            updatedImage = `/uploads/${req.file.filename}`;
        }

        const query = `
            UPDATE hotels
            SET image = $1, title = $2, description = $3, location = $4, latitude = $5, longitude = $6, price = $7
            WHERE id = $8
            RETURNING *;
        `;
        const values = [
            updatedImage,
            updatedTitle,
            updatedDescription,
            updatedLocation,
            updatedLatitude,
            updatedLongitude,
            Number(updatedPrice),
            Number(id)
        ];

        let result;
        try {
            result = await pool.query(query, values);
        } catch (dbErr) {
            if (newlyUploadedPath) await deleteFileSafely(newlyUploadedPath);
            throw dbErr;
        }

        if (req.file && existing.image && existing.image !== updatedImage) {
            const oldPath = path.join(__dirname, "..", existing.image.replace(/^\//, ""));
            await deleteFileSafely(oldPath);
        }

        return res.status(200).json({
            success: true,
            message: "Hotel updated successfully.",
            data: result.rows[0]
        });
    } catch (error) {
        if (req.file) await deleteFileSafely(req.file.path);
        console.error("updateHotel error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
            error: error.message
        });
    }
};

const deleteHotel = async (req, res) => {
    try {
        const { id } = req.params;
        if (isNaN(id) || Number(id) <= 0 || !Number.isInteger(Number(id))) {
            return res.status(400).json({ success: false, message: "Invalid hotel ID." });
        }

        const result = await pool.query(`DELETE FROM hotels WHERE id = $1 RETURNING *;`, [Number(id)]);
        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: `Hotel with ID ${id} not found.` });
        }

        const deleted = result.rows[0];
        if (deleted.image) {
            const imgPath = path.join(__dirname, "..", deleted.image.replace(/^\//, ""));
            await deleteFileSafely(imgPath);
        }

        return res.status(200).json({
            success: true,
            message: "Hotel deleted successfully.",
            data: deleted
        });
    } catch (error) {
        console.error("deleteHotel error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
            error: error.message
        });
    }
};

module.exports = {
    createHotel,
    getAllHotels,
    getHotelById,
    updateHotel,
    deleteHotel,
    validateHotelInput
};
