const pool = require("../config/db");
const fs   = require("fs");
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
                await new Promise((r) => setTimeout(r, 100));
            } else { return; }
        }
    }
};

function validateRoomInput({ room_type, price_per_night, capacity, adults_capacity, children_capacity, total_quantity }) {
    const errors = [];
    const allowedTypes = ["Standard", "Deluxe", "Premium", "Suite"];
    if (room_type && !allowedTypes.includes(room_type) && String(room_type).trim().length < 2)
        errors.push("room_type must be at least 2 characters.");

    if (price_per_night === undefined || price_per_night === null || String(price_per_night).trim() === "")
        errors.push("price_per_night is required.");
    else if (isNaN(price_per_night) || Number(price_per_night) <= 0)
        errors.push("price_per_night must be a positive number.");

    if (capacity !== undefined && (isNaN(capacity) || Number(capacity) <= 0))
        errors.push("capacity must be a positive integer.");

    if (adults_capacity !== undefined && (isNaN(adults_capacity) || Number(adults_capacity) < 0))
        errors.push("adults_capacity must be a non-negative integer.");

    if (children_capacity !== undefined && (isNaN(children_capacity) || Number(children_capacity) < 0))
        errors.push("children_capacity must be a non-negative integer.");

    if (total_quantity !== undefined && (isNaN(total_quantity) || Number(total_quantity) <= 0))
        errors.push("total_quantity must be a positive integer.");

    return errors;
}

const getDashboard = async (req, res) => {
    try {
        const ownerId = req.user.id;

        const [totalRes, approvedRes, pendingRes, rejectedRes, roomsRes, recentRes] = await Promise.all([
            pool.query("SELECT COUNT(*) FROM hotels WHERE owner_id = $1;", [ownerId]),
            pool.query("SELECT COUNT(*) FROM hotels WHERE owner_id = $1 AND approval_status = 'approved';", [ownerId]),
            pool.query("SELECT COUNT(*) FROM hotels WHERE owner_id = $1 AND approval_status = 'pending';", [ownerId]),
            pool.query("SELECT COUNT(*) FROM hotels WHERE owner_id = $1 AND approval_status = 'rejected';", [ownerId]),
            pool.query(
                `SELECT COUNT(r.room_id) FROM rooms r
                 JOIN hotels h ON r.hotel_id = h.id
                 WHERE h.owner_id = $1 AND r.status = 'active';`,
                [ownerId]
            ),
            pool.query(
                `SELECT id, title, approval_status, created_at
                 FROM hotels WHERE owner_id = $1
                 ORDER BY created_at DESC LIMIT 5;`,
                [ownerId]
            )
        ]);

        return res.status(200).json({
            success: true,
            data: {
                stats: {
                    total_hotels:    parseInt(totalRes.rows[0].count),
                    approved_hotels: parseInt(approvedRes.rows[0].count),
                    pending_hotels:  parseInt(pendingRes.rows[0].count),
                    rejected_hotels: parseInt(rejectedRes.rows[0].count),
                    active_rooms:    parseInt(roomsRes.rows[0].count)
                },
                recent_hotels: recentRes.rows
            }
        });
    } catch (error) {
        console.error("getDashboard error:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const getOwnerHotels = async (req, res) => {
    try {
        const ownerId = req.user.id;
        const { page = 1, limit = 10, status } = req.query;

        const pageNum  = Math.max(1, parseInt(page)  || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));
        const offset   = (pageNum - 1) * limitNum;

        let whereExtra = "";
        const values = [ownerId];
        if (status && ["pending", "approved", "rejected"].includes(status)) {
            whereExtra = " AND h.approval_status = $2";
            values.push(status);
        }

        const countRes = await pool.query(
            `SELECT COUNT(*) FROM hotels h WHERE h.owner_id = $1${whereExtra};`,
            values
        );
        const total = parseInt(countRes.rows[0].count);

        values.push(limitNum, offset);
        const dataRes = await pool.query(
            `SELECT h.*, 
                (SELECT COUNT(*) FROM rooms r WHERE r.hotel_id = h.id AND r.status = 'active') AS active_rooms
             FROM hotels h
             WHERE h.owner_id = $1${whereExtra}
             ORDER BY h.created_at DESC
             LIMIT $${values.length - 1} OFFSET $${values.length};`,
            values
        );

        return res.status(200).json({
            success: true,
            total,
            page: pageNum,
            totalPages: total > 0 ? Math.ceil(total / limitNum) : 0,
            limit: limitNum,
            count: dataRes.rowCount,
            data: dataRes.rows
        });
    } catch (error) {
        console.error("getOwnerHotels error:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const getOwnerHotelById = async (req, res) => {
    try {
        const { id }   = req.params;
        const ownerId  = req.user.id;

        if (isNaN(id) || Number(id) <= 0) {
            return res.status(400).json({ success: false, message: "Invalid hotel ID." });
        }

        const result = await pool.query(
            "SELECT * FROM hotels WHERE id = $1;",
            [Number(id)]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Hotel not found." });
        }

        const hotel = result.rows[0];
        if (hotel.owner_id !== ownerId) {
            return res.status(403).json({ success: false, message: "Access denied. This hotel does not belong to you." });
        }

        const rooms = await pool.query(
            "SELECT * FROM rooms WHERE hotel_id = $1 ORDER BY room_id ASC;",
            [hotel.id]
        );
        
        const images = await pool.query(
            "SELECT * FROM hotel_images WHERE hotel_id = $1 ORDER BY is_primary DESC, id ASC;",
            [hotel.id]
        );
        
        const amenities = await pool.query(
            `SELECT a.id, a.name, a.icon FROM amenities a
             JOIN hotel_amenities ha ON ha.amenity_id = a.id
             WHERE ha.hotel_id = $1;`,
            [hotel.id]
        );

        return res.status(200).json({
            success: true,
            data: { ...hotel, rooms: rooms.rows, images: images.rows, amenities: amenities.rows }
        });
    } catch (error) {
        console.error("getOwnerHotelById error:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const createOwnerHotel = async (req, res) => {
    try {
        const ownerId = req.user.id;
        const { title, description, location, latitude, longitude, price, amenities } = req.body;

        const errors = [];
        if (!title || String(title).trim().length < 2)
            errors.push("title is required (min 2 characters).");
        else if (String(title).trim().length > 150)
            errors.push("title cannot exceed 150 characters.");

        if (!location || String(location).trim().length < 2)
            errors.push("location is required.");
        else if (String(location).trim().length > 255)
            errors.push("location cannot exceed 255 characters.");

        if (!price || isNaN(price) || Number(price) <= 0)
            errors.push("price must be a positive number.");

        if (latitude !== undefined && latitude !== "" && (isNaN(latitude) || Number(latitude) < -90 || Number(latitude) > 90))
            errors.push("latitude must be between -90 and 90.");

        if (longitude !== undefined && longitude !== "" && (isNaN(longitude) || Number(longitude) < -180 || Number(longitude) > 180))
            errors.push("longitude must be between -180 and 180.");

        if (errors.length > 0) {
            if (req.file) await deleteFileSafely(req.file.path);
            return res.status(400).json({ success: false, message: "Validation failed.", errors });
        }

        const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            const result = await client.query(
                `INSERT INTO hotels (image, title, description, location, latitude, longitude, price, owner_id, approval_status)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
                 RETURNING *;`,
                [
                    imagePath,
                    String(title).trim(),
                    description ? String(description).trim() : null,
                    String(location).trim(),
                    latitude !== undefined && latitude !== "" ? Number(latitude) : null,
                    longitude !== undefined && longitude !== "" ? Number(longitude) : null,
                    Number(price),
                    ownerId
                ]
            );
            const hotel = result.rows[0];

            if (amenities) {
                const amenityIds = Array.isArray(amenities)
                    ? amenities
                    : String(amenities).split(",").map(a => a.trim()).filter(Boolean);

                for (const aid of amenityIds) {
                    if (!isNaN(aid)) {
                        await client.query(
                            "INSERT INTO hotel_amenities (hotel_id, amenity_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;",
                            [hotel.id, Number(aid)]
                        );
                    }
                }
            }

            if (imagePath) {
                await client.query(
                    "INSERT INTO hotel_images (hotel_id, image_path, is_primary) VALUES ($1, $2, true);",
                    [hotel.id, imagePath]
                );
            }

            await client.query("COMMIT");
            return res.status(201).json({
                success: true,
                message: "Hotel submitted for approval. It will appear publicly once approved.",
                data: hotel
            });
        } catch (err) {
            await client.query("ROLLBACK");
            if (req.file) await deleteFileSafely(req.file.path);
            throw err;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("createOwnerHotel error:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const updateOwnerHotel = async (req, res) => {
    try {
        const { id }  = req.params;
        const ownerId = req.user.id;

        if (isNaN(id) || Number(id) <= 0) {
            if (req.file) await deleteFileSafely(req.file.path);
            return res.status(400).json({ success: false, message: "Invalid hotel ID." });
        }

        const checkRes = await pool.query("SELECT * FROM hotels WHERE id = $1;", [Number(id)]);
        if (checkRes.rows.length === 0) {
            if (req.file) await deleteFileSafely(req.file.path);
            return res.status(404).json({ success: false, message: "Hotel not found." });
        }

        const existing = checkRes.rows[0];
        if (existing.owner_id !== ownerId) {
            if (req.file) await deleteFileSafely(req.file.path);
            return res.status(403).json({ success: false, message: "Access denied." });
        }

        const { title, description, location, latitude, longitude, price, amenities } = req.body;

        const updTitle    = title      !== undefined ? String(title).trim()       : existing.title;
        const updLocation = location   !== undefined ? String(location).trim()    : existing.location;
        const updDesc     = description !== undefined ? (description ? String(description).trim() : null) : existing.description;
        const updLat      = (latitude  !== undefined && String(latitude).trim() !== "")  ? Number(latitude)  : existing.latitude;
        const updLng      = (longitude !== undefined && String(longitude).trim() !== "") ? Number(longitude) : existing.longitude;
        const updPrice    = price !== undefined ? Number(price) : Number(existing.price);

        const errors = [];
        if (!updTitle || updTitle.length < 2) errors.push("title is required.");
        if (updTitle.length > 150) errors.push("title cannot exceed 150 characters.");
        if (!updLocation || updLocation.length < 2) errors.push("location is required.");
        if (isNaN(updPrice) || updPrice <= 0) errors.push("price must be a positive number.");

        if (errors.length > 0) {
            if (req.file) await deleteFileSafely(req.file.path);
            return res.status(400).json({ success: false, message: "Validation failed.", errors });
        }

        let updImage = existing.image;
        if (req.file) {
            updImage = `/uploads/${req.file.filename}`;
        }

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            const result = await client.query(
                `UPDATE hotels
                 SET image = $1, title = $2, description = $3, location = $4,
                     latitude = $5, longitude = $6, price = $7, updated_at = NOW()
                 WHERE id = $8
                 RETURNING *;`,
                [updImage, updTitle, updDesc, updLocation, updLat, updLng, updPrice, Number(id)]
            );

            if (amenities !== undefined) {
                await client.query("DELETE FROM hotel_amenities WHERE hotel_id = $1;", [Number(id)]);
                const amenityIds = Array.isArray(amenities)
                    ? amenities
                    : String(amenities).split(",").map(a => a.trim()).filter(Boolean);
                for (const aid of amenityIds) {
                    if (!isNaN(aid)) {
                        await client.query(
                            "INSERT INTO hotel_amenities (hotel_id, amenity_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;",
                            [Number(id), Number(aid)]
                        );
                    }
                }
            }

            await client.query("COMMIT");

            if (req.file && existing.image && existing.image !== updImage) {
                const oldPath = path.join(__dirname, "..", existing.image.replace(/^\//, ""));
                await deleteFileSafely(oldPath);
            }

            return res.status(200).json({ success: true, message: "Hotel updated.", data: result.rows[0] });
        } catch (err) {
            await client.query("ROLLBACK");
            if (req.file) await deleteFileSafely(req.file.path);
            throw err;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("updateOwnerHotel error:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const deleteOwnerHotel = async (req, res) => {
    try {
        const { id }  = req.params;
        const ownerId = req.user.id;

        if (isNaN(id) || Number(id) <= 0) {
            return res.status(400).json({ success: false, message: "Invalid hotel ID." });
        }

        const checkRes = await pool.query("SELECT * FROM hotels WHERE id = $1;", [Number(id)]);
        if (checkRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Hotel not found." });
        }

        const hotel = checkRes.rows[0];
        if (hotel.owner_id !== ownerId) {
            return res.status(403).json({ success: false, message: "Access denied." });
        }

        await pool.query("DELETE FROM hotels WHERE id = $1;", [Number(id)]);

        if (hotel.image) {
            const imgPath = path.join(__dirname, "..", hotel.image.replace(/^\//, ""));
            await deleteFileSafely(imgPath);
        }

        return res.status(200).json({ success: true, message: "Hotel deleted.", data: { id: hotel.id } });
    } catch (error) {
        console.error("deleteOwnerHotel error:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const uploadHotelImages = async (req, res) => {
    try {
        const { id }  = req.params;
        const ownerId = req.user.id;

        if (isNaN(id) || Number(id) <= 0) {
            return res.status(400).json({ success: false, message: "Invalid hotel ID." });
        }

        const checkRes = await pool.query("SELECT * FROM hotels WHERE id = $1;", [Number(id)]);
        if (checkRes.rows.length === 0) {
            if (req.files?.length) req.files.forEach(f => deleteFileSafely(f.path));
            return res.status(404).json({ success: false, message: "Hotel not found." });
        }

        if (checkRes.rows[0].owner_id !== ownerId) {
            if (req.files?.length) req.files.forEach(f => deleteFileSafely(f.path));
            return res.status(403).json({ success: false, message: "Access denied." });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: "No images uploaded." });
        }

        const inserted = [];
        for (const file of req.files) {
            const imagePath = `/uploads/${file.filename}`;
            const r = await pool.query(
                "INSERT INTO hotel_images (hotel_id, image_path, is_primary) VALUES ($1, $2, false) RETURNING *;",
                [Number(id), imagePath]
            );
            inserted.push(r.rows[0]);
        }

        return res.status(201).json({
            success: true,
            message: `${inserted.length} image(s) uploaded.`,
            data: inserted
        });
    } catch (error) {
        console.error("uploadHotelImages error:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const createRoom = async (req, res) => {
    try {
        const { id: hotelId } = req.params;
        const ownerId = req.user.id;

        if (isNaN(hotelId) || Number(hotelId) <= 0) {
            return res.status(400).json({ success: false, message: "Invalid hotel ID." });
        }

        const hotelRes = await pool.query("SELECT * FROM hotels WHERE id = $1;", [Number(hotelId)]);
        if (hotelRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Hotel not found." });
        }
        if (hotelRes.rows[0].owner_id !== ownerId) {
            return res.status(403).json({ success: false, message: "Access denied." });
        }

        const {
            room_type = "Standard", description, room_number,
            capacity = 2, adults_capacity = 2, children_capacity = 0,
            bed_type, price_per_night, total_quantity = 1
        } = req.body;

        const errors = validateRoomInput({ room_type, price_per_night, capacity, adults_capacity, children_capacity, total_quantity });
        if (errors.length > 0) {
            return res.status(400).json({ success: false, message: "Validation failed.", errors });
        }

        const result = await pool.query(
            `INSERT INTO rooms
             (hotel_id, room_type, description, room_number, capacity, adults_capacity,
              children_capacity, bed_type, price_per_night, total_quantity)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING *;`,
            [
                Number(hotelId),
                String(room_type).trim(),
                description ? String(description).trim() : null,
                room_number ? String(room_number).trim() : null,
                Number(capacity),
                Number(adults_capacity),
                Number(children_capacity),
                bed_type ? String(bed_type).trim() : null,
                Number(price_per_night),
                Number(total_quantity)
            ]
        );

        return res.status(201).json({ success: true, message: "Room created.", data: result.rows[0] });
    } catch (error) {
        console.error("createRoom error:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const getRooms = async (req, res) => {
    try {
        const { id: hotelId } = req.params;
        const ownerId = req.user.id;

        if (isNaN(hotelId) || Number(hotelId) <= 0) {
            return res.status(400).json({ success: false, message: "Invalid hotel ID." });
        }

        const hotelRes = await pool.query("SELECT owner_id FROM hotels WHERE id = $1;", [Number(hotelId)]);
        if (hotelRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Hotel not found." });
        }
        if (hotelRes.rows[0].owner_id !== ownerId) {
            return res.status(403).json({ success: false, message: "Access denied." });
        }

        const rooms = await pool.query(
            "SELECT * FROM rooms WHERE hotel_id = $1 ORDER BY room_id ASC;",
            [Number(hotelId)]
        );

        return res.status(200).json({ success: true, count: rooms.rowCount, data: rooms.rows });
    } catch (error) {
        console.error("getRooms error:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const updateRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const ownerId = req.user.id;

        if (isNaN(roomId) || Number(roomId) <= 0) {
            return res.status(400).json({ success: false, message: "Invalid room ID." });
        }

        const roomRes = await pool.query(
            `SELECT r.*, h.owner_id FROM rooms r JOIN hotels h ON r.hotel_id = h.id WHERE r.room_id = $1;`,
            [Number(roomId)]
        );
        if (roomRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Room not found." });
        }
        if (roomRes.rows[0].owner_id !== ownerId) {
            return res.status(403).json({ success: false, message: "Access denied." });
        }

        const existing = roomRes.rows[0];
        const {
            room_type, description, room_number, capacity, adults_capacity,
            children_capacity, bed_type, price_per_night, total_quantity, status
        } = req.body;

        const updType      = room_type        !== undefined ? String(room_type).trim()       : existing.room_type;
        const updDesc      = description      !== undefined ? (description ? String(description).trim() : null) : existing.description;
        const updNum       = room_number      !== undefined ? (room_number ? String(room_number).trim() : null) : existing.room_number;
        const updCap       = capacity         !== undefined ? Number(capacity)         : existing.capacity;
        const updAdults    = adults_capacity  !== undefined ? Number(adults_capacity)  : existing.adults_capacity;
        const updChildren  = children_capacity !== undefined ? Number(children_capacity) : existing.children_capacity;
        const updBed       = bed_type         !== undefined ? (bed_type ? String(bed_type).trim() : null) : existing.bed_type;
        const updPrice     = price_per_night  !== undefined ? Number(price_per_night)  : existing.price_per_night;
        const updQty       = total_quantity   !== undefined ? Number(total_quantity)   : existing.total_quantity;
        const updStatus    = status           !== undefined ? String(status)           : existing.status;

        const errors = validateRoomInput({
            room_type: updType, price_per_night: updPrice,
            capacity: updCap, adults_capacity: updAdults,
            children_capacity: updChildren, total_quantity: updQty
        });
        if (!["active", "inactive", "maintenance"].includes(updStatus))
            errors.push("status must be active, inactive, or maintenance.");

        if (errors.length > 0) {
            return res.status(400).json({ success: false, message: "Validation failed.", errors });
        }

        const result = await pool.query(
            `UPDATE rooms
             SET room_type = $1, description = $2, room_number = $3, capacity = $4,
                 adults_capacity = $5, children_capacity = $6, bed_type = $7,
                 price_per_night = $8, total_quantity = $9, status = $10, updated_at = NOW()
             WHERE room_id = $11
             RETURNING *;`,
            [updType, updDesc, updNum, updCap, updAdults, updChildren, updBed, updPrice, updQty, updStatus, Number(roomId)]
        );

        return res.status(200).json({ success: true, message: "Room updated.", data: result.rows[0] });
    } catch (error) {
        console.error("updateRoom error:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const deactivateRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const ownerId = req.user.id;

        if (isNaN(roomId) || Number(roomId) <= 0) {
            return res.status(400).json({ success: false, message: "Invalid room ID." });
        }

        const roomRes = await pool.query(
            "SELECT r.*, h.owner_id FROM rooms r JOIN hotels h ON r.hotel_id = h.id WHERE r.room_id = $1;",
            [Number(roomId)]
        );
        if (roomRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Room not found." });
        }
        if (roomRes.rows[0].owner_id !== ownerId) {
            return res.status(403).json({ success: false, message: "Access denied." });
        }

        const result = await pool.query(
            "UPDATE rooms SET status = 'inactive', updated_at = NOW() WHERE room_id = $1 RETURNING *;",
            [Number(roomId)]
        );

        return res.status(200).json({ success: true, message: "Room deactivated.", data: result.rows[0] });
    } catch (error) {
        console.error("deactivateRoom error:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

module.exports = {
    getDashboard,
    getOwnerHotels,
    getOwnerHotelById,
    createOwnerHotel,
    updateOwnerHotel,
    deleteOwnerHotel,
    uploadHotelImages,
    createRoom,
    getRooms,
    updateRoom,
    deactivateRoom
};

