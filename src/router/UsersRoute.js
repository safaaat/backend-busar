import express from "express";
import { register, login, logout, refreshToken } from "../controllers/Users.js";
import { RegisterValidasi, LoginValidasi } from "../middleware/validation/UserValidation.js";

const router = express.Router();

router.post("/register", RegisterValidasi, register);
router.post("/login", LoginValidasi, login);
router.delete("/logout", logout);
router.get("/token", refreshToken);

export default router;



