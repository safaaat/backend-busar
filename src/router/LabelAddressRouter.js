import express from "express";
import { getLabelAddress } from "../controllers/LabelAddress.js";

const router = express.Router();

router.get("/label/address", getLabelAddress);

export default router;
