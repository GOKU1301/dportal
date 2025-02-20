const socketIo = require("socket.io");
const { getMessages, saveMessage } = require("./db");

module.exports = (server) => {
    const io = socketIo(server);

    io.on("connection", (socket) => {
        console.log("A user connected");

        socket.on("joinGroup", async (group) => {
            console.log(`User joined group: ${group}`);
            socket.join(group);

            try {
                const messages = await getMessages(group);
                socket.emit("groupMessages", messages);
            } catch (error) {
                console.error("Error fetching messages:", error);
            }
        });

        socket.on("sendMessage", async (data) => {
            if (!data.group || !data.message || !data.sender) {
                console.error("Invalid message data: Missing group, message, or sender.");
                return;
            }

            console.log(`Received message: '${data.message}' from ${data.sender} in group '${data.group}'`);

            try {
                await saveMessage(data.group, data.message, data.sender);
                io.to(data.group).emit("message", data);
                console.log(`Emitted message to group '${data.group}'`);
            } catch (error) {
                console.error("Error saving message:", error);
            }
        });
        

        socket.on("disconnect", () => {
            console.log("A user disconnected");
        });
    });
};
