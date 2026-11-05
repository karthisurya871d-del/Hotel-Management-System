const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const blocklist = new Set();

const JWT_SECRET  = process.env.JWT_SECRET  || "stayora_dev_secret_change_in_prod";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "7d";
const COOKIE_NAME = "stayora_token";

function signAndSetCookie(res, payload) {
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000 
    });
    return token;
}

async function authenticate(req, res, next) {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) {
        return res.status(401).json({ success: false, message: "Authentication required." });
    }

    if (blocklist.has(token)) {
        return res.status(401).json({ success: false, message: "Session expired. Please log in again." });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        const result = await pool.query(
            "SELECT id, full_name, email, role, is_active FROM users WHERE id = $1;",
            [decoded.id]
        );
        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, message: "User not found." });
        }
        const user = result.rows[0];
        if (!user.is_active) {
            return res.status(403).json({ success: false, message: "Account has been deactivated." });
        }

        req.user  = user;
        req.token = token;
        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ success: false, message: "Session expired. Please log in again." });
        }
        return res.status(401).json({ success: false, message: "Invalid authentication token." });
    }
}

function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Authentication required." });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required role: ${roles.join(" or ")}.`
            });
        }
        next();
    };
}

function invalidateToken(token) {
    if (token) blocklist.add(token);
}

function clearCookie(res) {
    res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax"
    });
}

module.exports = {
    authenticate,
    requireRole,
    signAndSetCookie,
    invalidateToken,
    clearCookie,
    COOKIE_NAME,
    JWT_SECRET
};

