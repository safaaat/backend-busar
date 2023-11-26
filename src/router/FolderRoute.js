import express from "express";
import { postFolder, getFolder, deleteFolder } from "../controllers/Folder.js";

const router = express.Router();

router.post("/folder", postFolder);
router.get("/folder/:userId", getFolder);
router.post("/folder/delete", deleteFolder);

export default router;