import express from "express";
import {
    Login,
    Logout,
    Me,
    getUsersByUuid
} from "../controllers/Auth.js";

const router = express.Router();

router.get("/me/:uuid", Me);
router.get("/get/users/:uuid", getUsersByUuid);
router.post("/login", Login);
router.delete("/logout", Logout);

export default router;