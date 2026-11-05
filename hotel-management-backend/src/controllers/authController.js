const pool  = require("../config/db");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const {
    signAndSetCookie,
    invalidateToken,
    clearCookie
} = require("../middleware/authMiddleware");

const EMAIL_RE    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

function validateRegisterInput({ full_name, email, password, role }) {
    const errors = [];
    if (!full_name || String(full_name).trim().length < 2)
        errors.push("full_name must be at least 2 characters.");
    if (String(full_name || "").trim().length > 150)
        errors.push("full_name cannot exceed 150 characters.");

    if (!email || !EMAIL_RE.test(String(email).trim()))
        errors.push("A valid email address is required.");

    if (!password)
        errors.push("Password is required.");
    else if (!PASSWORD_RE.test(password))
        errors.push(
            "Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
        );

    if (role && !["customer", "hotel_owner"].includes(role))
        errors.push("Role must be 'customer' or 'hotel_owner'. Admin registration is not allowed.");

    return errors;
}

const register = async (req, res) => {
    try {
        const { full_name, email, password, phone, role: requestedRole } = req.body;

        const role = (requestedRole === "hotel_owner") ? "hotel_owner" : "customer";

        const errors = validateRegisterInput({ full_name, email, password, role: requestedRole });
        if (errors.length > 0) {
            return res.status(400).json({ success: false, message: "Validation failed.", errors });
        }

        const normalizedEmail = String(email).trim().toLowerCase();

        const existing = await pool.query(
            "SELECT id FROM users WHERE email = $1;",
            [normalizedEmail]
        );
        if (existing.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists.",
                errors: ["Email is already registered."]
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const result = await pool.query(
            `INSERT INTO users (full_name, email, phone, password_hash, role)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, full_name, email, phone, role, is_active, created_at;`,
            [
                String(full_name).trim(),
                normalizedEmail,
                phone ? String(phone).trim() : null,
                passwordHash,
                role
            ]
        );

        const user = result.rows[0];
        signAndSetCookie(res, { id: user.id, email: user.email, role: user.role });

        return res.status(201).json({
            success: true,
            message: "Account created successfully.",
            data: { user }
        });
    } catch (error) {
        console.error("register error:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required.",
                errors: ["Email and password are required."]
            });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const result = await pool.query(
            "SELECT id, full_name, email, phone, password_hash, role, is_active FROM users WHERE email = $1;",
            [normalizedEmail]
        );

        const INVALID_MSG = "Invalid email or password.";

        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, message: INVALID_MSG });
        }

        const user = result.rows[0];

        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: "This account has been deactivated. Please contact support."
            });
        }

        const passwordValid = await bcrypt.compare(password, user.password_hash);
        if (!passwordValid) {
            return res.status(401).json({ success: false, message: INVALID_MSG });
        }

        signAndSetCookie(res, { id: user.id, email: user.email, role: user.role });

        const { password_hash: _ph, ...userSafe } = user;
        return res.status(200).json({
            success: true,
            message: "Logged in successfully.",
            data: { user: userSafe }
        });
    } catch (error) {
        console.error("login error:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const logout = (req, res) => {
    invalidateToken(req.token);
    clearCookie(res);
    return res.status(200).json({ success: true, message: "Logged out successfully." });
};

const me = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, full_name, email, phone, role, is_active, created_at, updated_at FROM users WHERE id = $1;",
            [req.user.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "User not found." });
        }
        return res.status(200).json({ success: true, data: { user: result.rows[0] } });
    } catch (error) {
        console.error("me error:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const forgotPassword = async (req, res) => {
    
    const SAFE_RESPONSE = {
        success: true,
        message: "If an account with that email exists, a password reset link has been sent."
    };

    try {
        const { email } = req.body;
        if (!email) {
            return res.status(200).json(SAFE_RESPONSE);
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const result = await pool.query(
            "SELECT id FROM users WHERE email = $1 AND is_active = true;",
            [normalizedEmail]
        );

        if (result.rows.length === 0) {
            return res.status(200).json(SAFE_RESPONSE);
        }

        const userId = result.rows[0].id;
        const rawToken = crypto.randomBytes(32).toString("hex");
        const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); 

        await pool.query(
            "UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL;",
            [userId]
        );

        await pool.query(
            `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
             VALUES ($1, $2, $3);`,
            [userId, tokenHash, expiresAt]
        );

        const isDev = process.env.NODE_ENV !== "production";
        const responseData = { ...SAFE_RESPONSE };
        if (isDev) {
            responseData.dev_token = rawToken; 
            responseData.dev_note  = "In production this would be sent via email.";
        }

        return res.status(200).json(responseData);
    } catch (error) {
        console.error("forgotPassword error:", error.message);
        return res.status(200).json(SAFE_RESPONSE); 
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({
                success: false,
                message: "Token and new password are required.",
                errors: ["Token and new password are required."]
            });
        }

        if (!PASSWORD_RE.test(password)) {
            return res.status(400).json({
                success: false,
                message: "Validation failed.",
                errors: ["Password must be at least 8 characters and include uppercase, lowercase, number, and special character."]
            });
        }

        const tokenHash = crypto.createHash("sha256").update(String(token)).digest("hex");
        const result = await pool.query(
            `SELECT id, user_id, expires_at, used_at
             FROM password_reset_tokens
             WHERE token_hash = $1;`,
            [tokenHash]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ success: false, message: "Invalid or expired reset token." });
        }

        const prt = result.rows[0];
        if (prt.used_at) {
            return res.status(400).json({ success: false, message: "This reset token has already been used." });
        }
        if (new Date(prt.expires_at) < new Date()) {
            return res.status(400).json({ success: false, message: "This reset token has expired." });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            await client.query(
                "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2;",
                [passwordHash, prt.user_id]
            );
            await client.query(
                "UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1;",
                [prt.id]
            );
            await client.query("COMMIT");
        } catch (err) {
            await client.query("ROLLBACK");
            throw err;
        } finally {
            client.release();
        }

        return res.status(200).json({ success: true, message: "Password reset successfully. Please log in." });
    } catch (error) {
        console.error("resetPassword error:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const changePassword = async (req, res) => {
    try {
        const { current_password, new_password } = req.body;

        if (!current_password || !new_password) {
            return res.status(400).json({
                success: false,
                message: "current_password and new_password are required.",
                errors: ["current_password and new_password are required."]
            });
        }

        if (!PASSWORD_RE.test(new_password)) {
            return res.status(400).json({
                success: false,
                message: "Validation failed.",
                errors: ["New password must be at least 8 characters and include uppercase, lowercase, number, and special character."]
            });
        }

        const result = await pool.query(
            "SELECT password_hash FROM users WHERE id = $1;",
            [req.user.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        const valid = await bcrypt.compare(current_password, result.rows[0].password_hash);
        if (!valid) {
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect.",
                errors: ["Current password is incorrect."]
            });
        }

        const newHash = await bcrypt.hash(new_password, 12);
        await pool.query(
            "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2;",
            [newHash, req.user.id]
        );

        invalidateToken(req.token);
        clearCookie(res);

        return res.status(200).json({
            success: true,
            message: "Password changed successfully. Please log in again."
        });
    } catch (error) {
        console.error("changePassword error:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { full_name, phone } = req.body;

        if (req.body.role !== undefined) {
            return res.status(403).json({
                success: false,
                message: "Role cannot be changed through profile update."
            });
        }
        if (req.body.email !== undefined) {
            return res.status(400).json({
                success: false,
                message: "Email cannot be changed. Contact support for email updates."
            });
        }

        const errors = [];
        if (full_name !== undefined) {
            if (!full_name || String(full_name).trim().length < 2)
                errors.push("full_name must be at least 2 characters.");
            else if (String(full_name).trim().length > 150)
                errors.push("full_name cannot exceed 150 characters.");
        }
        if (errors.length > 0) {
            return res.status(400).json({ success: false, message: "Validation failed.", errors });
        }

        const current = await pool.query(
            "SELECT full_name, phone FROM users WHERE id = $1;",
            [req.user.id]
        );
        if (current.rows.length === 0) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        const updatedName  = full_name !== undefined ? String(full_name).trim() : current.rows[0].full_name;
        const updatedPhone = phone   !== undefined ? (phone ? String(phone).trim() : null) : current.rows[0].phone;

        const result = await pool.query(
            `UPDATE users SET full_name = $1, phone = $2, updated_at = NOW()
             WHERE id = $3
             RETURNING id, full_name, email, phone, role, is_active, created_at, updated_at;`,
            [updatedName, updatedPhone, req.user.id]
        );

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully.",
            data: { user: result.rows[0] }
        });
    } catch (error) {
        console.error("updateProfile error:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

module.exports = {
    register,
    login,
    logout,
    me,
    forgotPassword,
    resetPassword,
    changePassword,
    updateProfile
};

