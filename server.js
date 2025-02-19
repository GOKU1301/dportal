const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public")); // Serve static files (HTML, CSS, JS)

io.on("connection", (socket) => {
    console.log("A user connected");

    // Join a specific group
    socket.on("join group", (group) => {
        socket.join(group);
        socket.group = group;
        console.log(`User joined group: ${group}`);
        socket.emit("joined group", `You joined ${group}`);
    });

    // Handle sending messages to a group
    socket.on("chat message", (msg) => {
        if (socket.group) {
            io.to(socket.group).emit("chat message", msg); // Broadcast within the group
        }
    });

    // Handle user disconnect
    socket.on("disconnect", () => {
        console.log("A user disconnected");
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
