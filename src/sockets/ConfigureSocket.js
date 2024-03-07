// socketConfig.js
import { Server } from "socket.io";

export const io = new Server({
    cors: {
        origin: ["http://localhost:3000", "https://safaaat.github.io"],
        methods: ["GET", "POST"]
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