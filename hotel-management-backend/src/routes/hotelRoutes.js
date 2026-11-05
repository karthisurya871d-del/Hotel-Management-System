const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
    createHotel,
    getAllHotels,
    getHotelById,
    updateHotel,
    deleteHotel
} = require("../controllers/hotelController");

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e6)}${path.extname(file.originalname).toLowerCase()}`;
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedExtensions = /^\.(jpe?g|png|webp)$/i;
    const allowedMimeTypes = /^image\/(jpeg|png|webp)$/i;

    const extname = allowedExtensions.test(path.extname(file.originalname));
    const mimetype = allowedMimeTypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error("Only JPEG, JPG, PNG, and WEBP images are allowed."));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

const uploadMiddleware = (req, res, next) => {
    upload.single("image")(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            req.resume();
            if (err.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({
                    success: false,
                    message: "Image file size exceeds the 5MB limit.",
                    errors: ["Image file size exceeds the 5MB limit."]
                });
            }
            return res.status(400).json({
                success: false,
                message: err.message,
                errors: [err.message]
            });
        } else if (err) {
            req.resume();
            return res.status(400).json({
                success: false,
                message: err.message,
                errors: [err.message]
            });
        }
        next();
    });
};

router.post("/", uploadMiddleware, createHotel);
router.get("/", getAllHotels);
router.get("/:id", getHotelById);
router.put("/:id", uploadMiddleware, updateHotel);
router.delete("/:id", deleteHotel);

module.exports = router;
