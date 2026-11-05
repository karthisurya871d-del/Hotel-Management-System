const express = require("express");
const router  = express.Router();
const { authenticate, requireRole } = require("../middleware/authMiddleware");
const {
    getPendingHotels,
    setHotelApproval,
    getAllHotelsAdmin,
    getAllUsers,
    setUserStatus
} = require("../controllers/adminController");

const adminAuth = [authenticate, requireRole("admin")];

router.get("/hotels/pending",        ...adminAuth, getPendingHotels);
router.put("/hotels/:id/approval",   ...adminAuth, setHotelApproval);
router.get("/hotels",                ...adminAuth, getAllHotelsAdmin);
router.get("/users",                 ...adminAuth, getAllUsers);
router.put("/users/:id/status",      ...adminAuth, setUserStatus);

module.exports = router;

