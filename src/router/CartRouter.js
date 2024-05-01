import express from "express";
import { getCarts, removeCarts, addCart, updateAmountCart } from "../controllers/Carts.js";
import rateLimit from "express-rate-limit";

const router = express.Router();

// Rate limiting middleware
const limiter = rateLimit({
    windowMs: 10 * 1000, // 10 secon
    max: 5, // limit each IP to 5 requests per windowMs
    handler: (req, res) => {
        res.status(429).json({ message: "Terlalu banyak permintaan. Mohon tunggu beberapa saat sebelum mencoba lagi. Untuk mengubah jumlah produk, gunakan fitur keranjang belanja." });
    }
});

router.get("/cart/:uuidUser", getCarts);
router.post("/cart/:uuidUser", limiter, addCart);
router.patch("/cart/update", updateAmountCart);
router.delete("/cart/delete", removeCarts);

export default router;