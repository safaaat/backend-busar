import express from "express";
import { getCarts, removeCarts, addCart, updateAmountCart } from "../controllers/Carts.js";

const router = express.Router();

router.get("/cart/:uuidUser", getCarts);
router.post("/cart/:uuidUser", addCart);
router.patch("/cart/update", updateAmountCart);
router.delete("/cart/delete", removeCarts);

export default router;