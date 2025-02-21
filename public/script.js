// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAvAyazTVHV375ZSfBv2xj0yOEqv6Sohnk",
    authDomain: "student-chat-app-1e8d6.firebaseapp.com",
    projectId: "student-chat-app-1e8d6",
    storageBucket: "student-chat-app-1e8d6.firebasestorage.app",
    messagingSenderId: "1055604134555",
    appId: "1:1055604134555:web:808b5f8be22453dfc8ac3e"
};

// Initialize Firebase with custom name for this tab
const firebaseApp = firebase.initializeApp(firebaseConfig, 'app-' + Math.random().toString(36).substring(7));

// Initialize auth and firestore
const auth = firebase.auth(firebaseApp);
const db = firebase.firestore(firebaseApp);
const socket = io();

// Set persistence to session (tab-level) instead of local (browser-level)
auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);

let currentUser = null;
let selectedGroup = "";

// Sign out function
async function signOut() {
    try {
        await auth.signOut();
        // Don't reload the page, just update UI
        updateUIForSignOut();
    } catch (error) {
        console.error("Error signing out:", error);
    }
}

// Update UI for sign out without page reload
function updateUIForSignOut() {
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('chatSection').style.display = 'none';
    document.getElementById('profileSection').style.display = 'none';
    currentUser = null;
    selectedGroup = "";
    
    // Clear messages
    const messageList = document.getElementById("messages");
    messageList.innerHTML = "";
    
    // Reset input
    const messageInput = document.getElementById("messageInput");
    messageInput.value = "";
    messageInput.disabled = true;
    document.getElementById("sendButton").disabled = true;
}

// Google Sign In function
async function signInWithGoogle() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        // Force account selection every time
        provider.setCustomParameters({
            prompt: 'select_account'
        });
        const result = await auth.signInWithPopup(provider);
        console.log("Successfully signed in:", result.user);
    } catch (error) {
        console.error("Error signing in with Google:", error);
        alert("Error signing in with Google. Please try again.");
    }
}

// Auth state changes
auth.onAuthStateChanged((user) => {
    console.log("Auth state changed:", user); // Debug log
    if (user) {
        currentUser = {
            uid: user.uid,
            name: user.displayName,
            email: user.email,
            photoURL: user.photoURL || null
        };
        
        // Show chat section and hide login
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('chatSection').style.display = 'block';
        document.getElementById('profileSection').style.display = 'flex';
        
        // Update profile display
        document.getElementById('userName').textContent = currentUser.name;
        const profileImage = document.getElementById('profileImage');
        
        if (currentUser.photoURL) {
            profileImage.style.backgroundImage = `url(${currentUser.photoURL})`;
            profileImage.textContent = '';
        } else {
            profileImage.style.backgroundImage = 'none';
            profileImage.textContent = currentUser.name.charAt(0).toUpperCase();
        }

        // If there was a previously selected group, rejoin it
        if (selectedGroup) {
            joinGroup(selectedGroup);
        }
    } else {
        updateUIForSignOut();
    }
});

// Join a group
function joinGroup() {
    if (!currentUser) return;
    
    const groupSelect = document.getElementById("groupSelect");
    const group = groupSelect.value;
    
    if (!group) {
        alert("Please select a group first");
        return;
    }
    
    selectedGroup = group;
    socket.emit("joinGroup", { 
        group, 
        username: currentUser.name
    });

    document.getElementById("messageInput").disabled = false;
    document.getElementById("sendButton").disabled = false;
}

// Send a new message
function sendMessage() {
    if (!currentUser || !selectedGroup) return;
    
    const messageInput = document.getElementById("messageInput");
    const message = messageInput.value.trim();

    if (message) {
        const messageData = {
            group: selectedGroup,
            message,
            sender: currentUser.name
        };
        
        socket.emit("sendMessage", messageData);
        messageInput.value = "";
    }
}

// Append messages to chat
function appendMessage(sender, message) {
    const messageList = document.getElementById("messages");
    const messageItem = document.createElement("div");
    messageItem.className = "message-item";

    // Create profile initial
    const profileDiv = document.createElement("div");
    profileDiv.className = "profile-image";
    profileDiv.textContent = sender.charAt(0).toUpperCase();

    // Create message content
    const contentDiv = document.createElement("div");
    contentDiv.className = "message-content";
    
    const senderDiv = document.createElement("div");
    senderDiv.className = "message-sender";
    senderDiv.textContent = sender;
    
    const messageText = document.createElement("div");
    messageText.textContent = message;

    contentDiv.appendChild(senderDiv);
    contentDiv.appendChild(messageText);
    
    messageItem.appendChild(profileDiv);
    messageItem.appendChild(contentDiv);
    
    messageList.appendChild(messageItem);
    messageList.scrollTop = messageList.scrollHeight;
}

// Receive previous messages when joining a group
socket.on("groupMessages", (messages) => {
    const messageList = document.getElementById("messages");
    messageList.innerHTML = "";
    messages.forEach(({ message, sender }) => appendMessage(sender, message));
});

// Receive new messages
socket.on("message", ({ message, sender }) => {
    appendMessage(sender, message);
});

// Handle user joined notification
socket.on("userJoined", (username) => {
    const messageList = document.getElementById("messages");
    const messageElement = document.createElement("div");
    messageElement.style.textAlign = "center";
    messageElement.style.fontStyle = "italic";
    messageElement.style.margin = "10px 0";
    messageElement.textContent = `${username} has joined the group.`;
    messageList.appendChild(messageElement);
});

socket.on("connect", () => {
    console.log("Socket connected:", socket.id); // Log the socket ID
});

// Handle message error
socket.on("messageError", ({ error }) => {
    console.error("Message error:", error);
    alert("Failed to send message. Please try again.");
});
