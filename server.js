import express from "express";
import dotenv from "dotenv";
import db from "./src/config/Database.js";
import UserModel from "./src/models/UserModel.js";
import CatatanModel from "./src/models/CatatanModel.js";
import ForderModel from "./src/models/FolderModel.js";
import UsersRoute from "./src/router/UsersRoute.js";
import CatatanRoute from "./src/router/CatatanRoute.js"
import FolderRoute from "./src/router/FolderRoute.js"
import cookieParser from "cookie-parser";
import cors from "cors";
dotenv.config();

const port = process.env.PORT || 5001
const app = express();


try {
    await db.authenticate();
    console.log("Database Connected...");
    await UserModel.sync();
    await CatatanModel.sync();
    await ForderModel.sync();
} catch (error) {
    console.error(error);
}

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', "*");
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
})

app.use(cors({
    credentials: true,
    origin: ["http://localhost:3000", "https://safaaat.github.io"]
}))

app.use(cookieParser());
app.use(express.json());
app.use(UsersRoute);
app.use(CatatanRoute);
app.use(FolderRoute);

app.listen(port, () => console.log(`Server Running ${port}`));

