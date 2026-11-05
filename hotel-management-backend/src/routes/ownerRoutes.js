const express = require("express");
const router  = express.Router();
const multer  = require("multer");
const path    = require("path");
const fs      = require("fs");
const { authenticate, requireRole } = require("../middleware/authMiddleware");
const {
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
} = require("../controllers/ownerController");

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, uploadDir); },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${path.extname(file.originalname).toLowerCase()}`);
    }
});

const fileFilter = (req, file, cb) => {
    const extOk  = /^\.(jpe?g|png|webp)$/i.test(path.extname(file.originalname));
    const mimeOk = /^image\/(jpeg|png|webp)$/i.test(file.mimetype);
    if (extOk && mimeOk) cb(null, true);
    else cb(new Error("Only JPEG, JPG, PNG, and WEBP images are allowed."));
};

const uploadSingle = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadMulti  = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

function singleImageMiddleware(req, res, next) {
    uploadSingle.single("image")(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            req.resume();
            const msg = err.code === "LIMIT_FILE_SIZE"
                ? "Image file size exceeds the 5MB limit."
                : err.message;
            return res.status(400).json({ success: false, message: msg, errors: [msg] });
        } else if (err) {
            req.resume();
            return res.status(400).json({ success: false, message: err.message, errors: [err.message] });
        }
        next();
    });
}

function multiImageMiddleware(req, res, next) {
    uploadMulti.array("images", 10)(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            req.resume();
            const msg = err.code === "LIMIT_FILE_SIZE"
                ? "One or more images exceed the 5MB limit."
                : err.message;
            return res.status(400).json({ success: false, message: msg, errors: [msg] });
        } else if (err) {
            req.resume();
            return res.status(400).json({ success: false, message: err.message, errors: [err.message] });
        }
        next();
    });
}

const ownerAuth = [authenticate, requireRole("hotel_owner")];

router.get("/dashboard",             ...ownerAuth, getDashboard);
router.get("/hotels",                ...ownerAuth, getOwnerHotels);
router.post("/hotels",               ...ownerAuth, singleImageMiddleware, createOwnerHotel);
router.get("/hotels/:id",            ...ownerAuth, getOwnerHotelById);
router.put("/hotels/:id",            ...ownerAuth, singleImageMiddleware, updateOwnerHotel);
router.delete("/hotels/:id",         ...ownerAuth, deleteOwnerHotel);
router.post("/hotels/:id/images",    ...ownerAuth, multiImageMiddleware, uploadHotelImages);
router.post("/hotels/:id/rooms",     ...ownerAuth, createRoom);
router.get("/hotels/:id/rooms",      ...ownerAuth, getRooms);
router.put("/rooms/:roomId",         ...ownerAuth, updateRoom);
router.delete("/rooms/:roomId",      ...ownerAuth, deactivateRoom);

module.exports = router;

