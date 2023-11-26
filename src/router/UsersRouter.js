import express from "express";
import {
    getUsersByEmail,
    createUsers, updateUsers,
    deleteUsers, changeEmailUsers,
    updateIdAddress,
    getUsers
} from "../controllers/Users.js";


const router = express.Router();

router.get("/users", getUsers);
router.get("/users/:email", getUsersByEmail);
router.post("/users", createUsers);
router.patch("/users/:id", updateUsers);
router.delete("/users/:id", deleteUsers);
router.patch("/users/email/:uuid", changeEmailUsers);
router.patch("/users/address/:uuid", updateIdAddress);

export default router;