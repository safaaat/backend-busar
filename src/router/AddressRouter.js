import express from "express";
import { createAddress, getAddress, removeAddress, updateAddress, updateChoiceAddress, updateMainAddress } from "../controllers/Address.js";

const router = express.Router();

router.get("/address/:uuid", getAddress);
router.post("/address", createAddress);
router.delete("/address/:uuid", removeAddress);
router.patch("/address", updateAddress);
router.patch("/update/main/address", updateMainAddress);
router.patch("/update/choice/address", updateChoiceAddress);

export default router;