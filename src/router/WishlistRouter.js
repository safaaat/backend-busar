import express from "express";
import { addWishlist, getWishlist, removeWishlist } from "../controllers/Wishlist.js";

const router = express.Router();

router.get("/wishlist/:uuidUser", getWishlist);
router.post("/add/wishlist", addWishlist);
router.delete("/wishlist/:id", removeWishlist);

export default router;