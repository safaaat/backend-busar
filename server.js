import express from "express";
import dotenv from "dotenv";
import db from "./src/config/Database.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import UsersRouter from "./src/router/UsersRouter.js";
import AuthRoute from "./src/router/UsersRouter.js"
dotenv.config();

const port = process.env.PORT || 5000
const app = express();


try {
    await db.sync()
    // await db.authenticate();
    console.log("Database Connected...");
    // await UserModel.sync();
    // await CatatanModel.sync();
    // await ForderModel.sync();
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

// Router
app.use(UsersRouter);
app.use(AuthRoute);

app.listen(port, () => console.log(`Server Running ${port}`));
