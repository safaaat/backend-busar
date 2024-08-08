// socketConfig.js
import { Server } from "socket.io";
import Carts from "../models/CartModel.js";
import Wishlist from "../models/WishlistModel.js";

export const io = new Server({
    cors: {
        origin: ["http://localhost:3000", "https://safaaat.github.io"],
        methods: ["GET", "POST"],
        credentials: true
    },
});

io.on("connection", (socket) => {
    console.log("Client connected");

    socket.on("disconnect", () => {
        console.log("Client disconnected");
    });
});

export const handleBroadcastClient = (event, data) => {
    io.emit(event, data);
}

export const handleSendMessage = (event, message) => {
    io.emit(event, message)
}

export const sendCartDataToClient = async (uuidUsers) => {
    const cart = await Carts.findAll({
        where: {
            uuidUser: uuidUsers
        }
    })

    io.emit(`${uuidUsers}-socket-cart`, cart);
}

export const sendWishlistDataToClient = async (uuidUsers) => {
    const wishlists = await Wishlist.findAll({
        where: {
            uuidUser: uuidUsers
        }
    });

    io.emit(`${uuidUsers}-socket-wishlists`, wishlists);
}