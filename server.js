import express from "express";
import dotenv from "dotenv";
import db from "./src/config/Database.js";
import cookieParser from "cookie-parser";
import { UsersRouter, AuthRouter, CategoryRouter, AddressRouter, ProductRouter, WishlistRouter, CartRouter, LabelAddressRouter, PaymentRouter } from "./src/router/index.js";
import http from "http";
import { io } from "./src/sockets/ConfigureSocket.js";
import { checkAndUpdateExpiredPayments, updatePurchaseStatusAccepted, updatePurchaseStatusDelivered } from "./src/servis.js/PaymentServis.js";

dotenv.config();

const port = process.env.PORT || 5000
const app = express();

const server = http.createServer(app);
io.attach(server); // Attach Socket.IO to the HTTP server

try {
    await db.sync()
    console.log("Database Connected...");
} catch (error) {
    console.error(error);
}

app.use((req, res, next) => {
    // res.setHeader('Access-Control-Allow-Origin', "*");
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    next();
})

app.use(cookieParser());
app.use(express.json());
app.use(express.static("src/public"))

// Router
app.use(UsersRouter);
app.use(AuthRouter);
app.use(CategoryRouter);
app.use(AddressRouter);
app.use(ProductRouter);
app.use(WishlistRouter);
app.use(CartRouter);
app.use(LabelAddressRouter);
app.use(PaymentRouter);

server.listen(port, async () => {
    // Jalankan fungsi checkAndUpdateExpiredPayments sekali saat server dijalankan
    await checkAndUpdateExpiredPayments();
    await updatePurchaseStatusDelivered();
    await updatePurchaseStatusAccepted();

    // Panggil fungsi ini secara berkala (misalnya, setiap 1 jam)
    // setInterval(checkAndUpdateExpiredPayments, 1 * 60 * 60 * 1000);

    // Panggil fungsi ini secara berkala (misalnya, setiap 15 menit)
    // setInterval(updatePurchaseStatusDelivered, 15 * 60 * 1000); // 15 menit dalam milidetik
    // Panggil fungsi ini secara berkala (misalnya, setiap 15 menit)
    // setInterval(updatePurchaseStatusAccepted, 1 * 60 * 60 * 1000); // 15 menit dalam milidetik


    setInterval(updatePurchaseStatusDelivered, 1 * 60 * 1000);
    setInterval(updatePurchaseStatusAccepted, 2 * 60 * 1000);
    setInterval(checkAndUpdateExpiredPayments, 1 * 60 * 1000);

    console.log(`Server Running ${port}`);
});