const pool = require("../config/db");

const getPendingHotels = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const pageNum  = Math.max(1, parseInt(page)  || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));
        const offset   = (pageNum - 1) * limitNum;

        const countRes = await pool.query(
            "SELECT COUNT(*) FROM hotels WHERE approval_status = 'pending';"
        );
        const total = parseInt(countRes.rows[0].count);

        const dataRes = await pool.query(
            `SELECT h.*, u.full_name AS owner_name, u.email AS owner_email
             FROM hotels h
             LEFT JOIN users u ON h.owner_id = u.id
             WHERE h.approval_status = 'pending'
             ORDER BY h.created_at ASC
             LIMIT $1 OFFSET $2;`,
            [limitNum, offset]
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
        console.error("getPendingHotels error:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const setHotelApproval = async (req, res) => {
    try {
        const { id }              = req.params;
        const { status, rejection_reason } = req.body;
        const adminId             = req.user.id;

        if (isNaN(id) || Number(id) <= 0) {
            return res.status(400).json({ success: false, message: "Invalid hotel ID." });
        }

        const allowed = ["approved", "rejected"];
        if (!status || !allowed.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `status must be 'approved' or 'rejected'.`,
                errors: [`status must be one of: ${allowed.join(", ")}.`]
            });
        }

        if (status === "rejected" && (!rejection_reason || String(rejection_reason).trim().length < 5)) {
            return res.status(400).json({
                success: false,
                message: "A rejection reason is required (min 5 characters).",
                errors: ["rejection_reason is required when rejecting a hotel."]
            });
        }

        const checkRes = await pool.query("SELECT * FROM hotels WHERE id = $1;", [Number(id)]);
        if (checkRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Hotel not found." });
        }

        const result = await pool.query(
            `UPDATE hotels
             SET approval_status = $1,
                 rejection_reason = $2,
                 approved_by = $3,
                 approved_at = NOW(),
                 updated_at = NOW()
             WHERE id = $4
             RETURNING *;`,
            [
                status,
                status === "rejected" ? String(rejection_reason).trim() : null,
                adminId,
                Number(id)
            ]
        );

        return res.status(200).json({
            success: true,
            message: `Hotel ${status} successfully.`,
            data: result.rows[0]
        });
    } catch (error) {
        console.error("setHotelApproval error:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const getAllHotelsAdmin = async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const pageNum  = Math.max(1, parseInt(page)  || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));
        const offset   = (pageNum - 1) * limitNum;

        const values = [];
        let whereClause = "";
        if (status && ["pending", "approved", "rejected"].includes(status)) {
            whereClause = "WHERE h.approval_status = $1";
            values.push(status);
        }

        const countRes = await pool.query(
            `SELECT COUNT(*) FROM hotels h ${whereClause};`, values
        );
        const total = parseInt(countRes.rows[0].count);

        values.push(limitNum, offset);
        const dataRes = await pool.query(
            `SELECT h.*, u.full_name AS owner_name, u.email AS owner_email, u.phone AS owner_phone
             FROM hotels h
             LEFT JOIN users u ON h.owner_id = u.id
             ${whereClause}
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
        console.error("getAllHotelsAdmin error:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 20, role } = req.query;
        const pageNum  = Math.max(1, parseInt(page)  || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
        const offset   = (pageNum - 1) * limitNum;

        const values = [];
        let whereClause = "";
        if (role && ["customer", "hotel_owner", "admin"].includes(role)) {
            whereClause = "WHERE role = $1";
            values.push(role);
        }

        const countRes = await pool.query(`SELECT COUNT(*) FROM users ${whereClause};`, values);
        const total = parseInt(countRes.rows[0].count);

        values.push(limitNum, offset);
        const dataRes = await pool.query(
            `SELECT id, full_name, email, phone, role, is_active, created_at, updated_at
             FROM users
             ${whereClause}
             ORDER BY created_at DESC
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
        console.error("getAllUsers error:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const setUserStatus = async (req, res) => {
    try {
        const { id }       = req.params;
        const { is_active } = req.body;
        const adminId      = req.user.id;

        if (isNaN(id) || Number(id) <= 0) {
            return res.status(400).json({ success: false, message: "Invalid user ID." });
        }

        if (typeof is_active !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "is_active must be a boolean.",
                errors: ["is_active must be true or false."]
            });
        }

        if (Number(id) === adminId) {
            return res.status(400).json({ success: false, message: "You cannot deactivate your own account." });
        }

        const checkRes = await pool.query("SELECT id, role FROM users WHERE id = $1;", [Number(id)]);
        if (checkRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        const result = await pool.query(
            "UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING id, full_name, email, role, is_active;",
            [is_active, Number(id)]
        );

        return res.status(200).json({
            success: true,
            message: `User account ${is_active ? "activated" : "deactivated"}.`,
            data: result.rows[0]
        });
    } catch (error) {
        console.error("setUserStatus error:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

module.exports = {
    getPendingHotels,
    setHotelApproval,
    getAllHotelsAdmin,
    getAllUsers,
    setUserStatus
};

