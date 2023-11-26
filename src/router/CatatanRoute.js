import express from "express";
import { getCatatan, postCatatan, updateCatatan, deleteCatatan } from "../controllers/Catatan.js";

const router = express.Router();

router.get("/catatan/:id", getCatatan);
router.post("/catatan", postCatatan);
router.patch("/catatan/:id", updateCatatan);
router.post("/catatan/delete", deleteCatatan);

export default router;