const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { saveMessage, getMessages } = require("./db");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

io.on("connection", (socket) => {
    console.log("A user connected");

    // Join group and send previous messages
    socket.on("joinGroup", async ({ group, username }) => {
        socket.join(group);
        socket.group = group;
        socket.username = username;

        console.log(`User ${username} joined group: ${group}`);
        
        // Send old messages to user
        const messages = await getMessages(group);
        socket.emit("groupMessages", messages);

        // Notify other users in the group
        socket.to(group).emit("userJoined", username);
    });

    // Handle new message
    socket.on("sendMessage", async (data) => {
        if (socket.group) {
            try {
                // Extract only the fields we want to save
                const { group, message, sender } = data;
                const savedMessage = await saveMessage(group, message, sender);
                io.to(socket.group).emit("message", savedMessage);
            } catch (error) {
                console.error("Error saving/sending message:", error);
                socket.emit("messageError", { error: "Failed to send message" });
            }
        }
    });

    socket.on("disconnect", () => {
        console.log("A user disconnected");
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
}); 