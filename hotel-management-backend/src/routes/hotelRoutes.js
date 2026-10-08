const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { createHotel, getAllHotels, getHotelById, updateHotel, deleteHotel } = require("../controllers/hotelController");

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
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e6)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});
const fileFilter = (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) {
        cb(null, true);
    } else {
        cb(new Error("Only JPEG, JPG, PNG, and WEBP images are allowed."));
    }
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
router.post("/",      upload.single("image"), createHotel);
router.get("/",       getAllHotels);
router.get("/:id",    getHotelById);
router.put("/:id",    upload.single("image"), updateHotel);
router.delete("/:id", deleteHotel);
module.exports = router;