import express from "express";
import { createAddress, getAddress, removeAddress, updateAddress } from "../controllers/Address.js";

const router = express.Router();

router.get("/address/:uuid", getAddress);
router.post("/address", createAddress);
router.delete("/address/:uuid", removeAddress);
router.patch("/address", updateAddress);

export default router;