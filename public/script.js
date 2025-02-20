const socket = io();
let selectedGroup = "";

// Join a group
function joinGroup() {
    const groupSelect = document.getElementById("groupSelect");
    const group = groupSelect.value;
    const usernameInput = document.getElementById("usernameInput");
    const username = usernameInput.value.trim(); // Get the username

    if (!username) {
        alert("Please enter your name.");
        return; // Prevent joining without a name
    }

    selectedGroup = group;
    socket.emit("joinGroup", { group, username }); // Send both group and username

    document.getElementById("messageInput").disabled = false;
    document.getElementById("sendButton").disabled = false;
    console.log(`Joined group: ${group} as ${username}`);
}

// Receive previous messages when joining a group
socket.on("groupMessages", (messages) => {
    console.log("Previous messages received:", messages);

    const messageList = document.getElementById("messages");
    messageList.innerHTML = ""; // Clear previous list
    messages.forEach(({ message, sender }) => appendMessage(sender, message));
});

// Receive new messages
socket.on("message", ({ message, sender }) => {
    console.log("New message received:", { message, sender });
    appendMessage(sender, message);
});

// Send a new message
function sendMessage() {
    const messageInput = document.getElementById("messageInput");
    const message = messageInput.value.trim();
    const sender = document.getElementById("usernameInput").value.trim(); // Get the username

    if (message) {
        console.log("Sending message:", { group: selectedGroup, message, sender });
        socket.emit("sendMessage", { group: selectedGroup, message, sender });
        messageInput.value = "";
    }
}

// Append messages to chat
function appendMessage(sender, message) {
    const messageList = document.getElementById("messages");
    const messageElement = document.createElement("li");
    messageElement.textContent = `${sender}: ${message}`;
    messageList.appendChild(messageElement);
    console.log(`Appended message: ${sender}: ${message}`); // Log appended message
}

socket.on("connect", () => {
    console.log("Socket connected:", socket.id); // Log the socket ID
});

socket.on("userJoined", (username) => {
    const messageList = document.getElementById("messages");
    const messageElement = document.createElement("li");
    messageElement.textContent = `${username} has joined the group.`;
    messageElement.style.fontWeight = "bold"; // Make it stand out
    messageList.appendChild(messageElement);
    console.log(`${username} has joined the group.`);
});
