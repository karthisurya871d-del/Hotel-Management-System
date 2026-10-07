const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const { createHotel, getAllHotels, getHotelById, updateHotel, deleteHotel } = require("../controllers/hotelController");

// Multer config — store images in src/uploads/
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../uploads"));
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

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

router.post("/",      upload.single("image"), createHotel);
router.get("/",       getAllHotels);
router.get("/:id",    getHotelById);
router.put("/:id",    upload.single("image"), updateHotel);
router.delete("/:id", deleteHotel);

module.exports = router;