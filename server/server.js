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
    socket.on("joinGroup", async ({ group, subgroup, username }) => {
        const roomId = subgroup ? `${group}-${subgroup}` : group;
        socket.join(roomId);
        socket.group = group;
        socket.subgroup = subgroup;
        socket.username = username;

        console.log(`User ${username} joined group: ${group}, subgroup: ${subgroup}`);
        
        // Send old messages to user
        const messages = await getMessages(group, subgroup);
        socket.emit("groupMessages", messages);

        // Notify other users in the group
        socket.to(roomId).emit("userJoined", username);
    });

    // Handle new message
    socket.on("sendMessage", async (data) => {
        if (socket.group) {
            try {
                const { group, subgroup, message, sender } = data;
                const savedMessage = await saveMessage(group, subgroup, message, sender);
                const roomId = subgroup ? `${group}-${subgroup}` : group;
                io.to(roomId).emit("message", savedMessage);
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
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Access locally via http://localhost:${PORT}`);
    console.log(`Other devices on your network can access via http://<your-ip-address>:${PORT}`);
}); 