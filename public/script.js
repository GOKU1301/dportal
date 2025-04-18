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

// Initialize auth and firestore with development settings
const auth = firebase.auth(firebaseApp);
auth.useDeviceLanguage();
// Enable HTTP for development
if (window.location.hostname === 'localhost' || window.location.hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
    auth.settings.appVerificationDisabledForTesting = true;
}

const db = firebase.firestore(firebaseApp);
const socket = io();

// Set persistence to LOCAL (browser-level) instead of SESSION (tab-level)
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

let currentUser = null;
let selectedGroup = localStorage.getItem('selectedGroup') || "";
let selectedSubgroup = localStorage.getItem('selectedSubgroup') || "";

// Manage message timestamps with localStorage
const messageTimestamps = {
    // Load stored timestamps from localStorage
    init: function() {
        try {
            const stored = localStorage.getItem('messageTimestamps');
            return stored ? JSON.parse(stored) : {};
        } catch (e) {
            console.error("Error loading timestamps:", e);
            return {};
        }
    },
    
    // Save timestamps to localStorage
    save: function(timestamps) {
        try {
            localStorage.setItem('messageTimestamps', JSON.stringify(timestamps));
        } catch (e) {
            console.error("Error saving timestamps:", e);
        }
    },
    
    // Store map of message IDs to timestamps
    data: {}
};

// Initialize timestamp data
messageTimestamps.data = messageTimestamps.init();

// Create a unique ID for each message (for timestamp tracking)
function generateMessageId(sender, message, group, subgroup) {
    return `${sender}_${message.substring(0, 20)}_${group}_${subgroup}`;
}

// Sign out function
async function signOut() {
    try {
        // Clear saved group/subgroup from localStorage
        localStorage.removeItem('selectedGroup');
        localStorage.removeItem('selectedSubgroup');
        
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
    selectedSubgroup = "";
    
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
        console.log("Starting Google sign-in process...");
        console.log("Current hostname:", window.location.hostname);
        console.log("Current origin:", window.location.origin);
        
        const provider = new firebase.auth.GoogleAuthProvider();
        // Force account selection every time
        provider.setCustomParameters({
            prompt: 'select_account'
        });
        const result = await auth.signInWithPopup(provider);
        console.log("Successfully signed in:", result.user);
    } catch (error) {
        console.error("Error signing in with Google:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        if (error.email) console.error("Error email:", error.email);
        if (error.credential) console.error("Error credential:", error.credential);
        
        let errorMessage = "Error signing in with Google. ";
        
        // Add specific error messages based on error code
        switch (error.code) {
            case 'auth/popup-blocked':
                errorMessage += "Please allow popups for this website.";
                break;
            case 'auth/popup-closed-by-user':
                errorMessage += "Sign-in popup was closed before completing.";
                break;
            case 'auth/unauthorized-domain':
                errorMessage += "This domain is not authorized for Google sign-in. Current origin: " + window.location.origin;
                break;
            case 'auth/operation-not-supported-in-this-environment':
                errorMessage += "Authentication not supported in this environment. Try using HTTPS or add this domain to Firebase authorized domains.";
                break;
            default:
                errorMessage += error.message || "Please try again.";
        }
        
        alert(errorMessage);
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

        // Restore UI from localStorage group selections if they exist
        if (selectedGroup && selectedSubgroup) {
            // Update the UI dropdown values to match saved values
            const groupSelect = document.getElementById("groupSelect");
            const subgroupSelect = document.getElementById("subgroupSelect");
            
            groupSelect.value = selectedGroup;
            // Enable subgroup dropdown
            subgroupSelect.disabled = false;
            subgroupSelect.value = selectedSubgroup;
            
            // Join the saved group automatically
            joinGroup();
        }
    } else {
        updateUIForSignOut();
    }
});

// Handle group change
function handleGroupChange() {
    const groupSelect = document.getElementById("groupSelect");
    const subgroupSelect = document.getElementById("subgroupSelect");
    
    if (groupSelect.value) {
        subgroupSelect.disabled = false;
        selectedGroup = groupSelect.value;
        // Save to localStorage
        localStorage.setItem('selectedGroup', selectedGroup);
        
        // Reset subgroup selection
        subgroupSelect.value = "";
        selectedSubgroup = "";
        localStorage.removeItem('selectedSubgroup');
        
        document.getElementById("messageInput").disabled = true;
        document.getElementById("sendButton").disabled = true;
    } else {
        subgroupSelect.disabled = true;
        selectedGroup = "";
        selectedSubgroup = "";
        // Clear from localStorage
        localStorage.removeItem('selectedGroup');
        localStorage.removeItem('selectedSubgroup');
        
        document.getElementById("messageInput").disabled = true;
        document.getElementById("sendButton").disabled = true;
    }
}

// Join a group
function joinGroup() {
    if (!currentUser) return;
    
    const groupSelect = document.getElementById("groupSelect");
    const subgroupSelect = document.getElementById("subgroupSelect");
    const group = groupSelect.value || selectedGroup;
    const subgroup = subgroupSelect.value || selectedSubgroup;
    
    if (!group || !subgroup) {
        alert("Please select both a group and subgroup first");
        return;
    }
    
    selectedGroup = group;
    selectedSubgroup = subgroup;
    
    // Save to localStorage for persistence
    localStorage.setItem('selectedGroup', selectedGroup);
    localStorage.setItem('selectedSubgroup', selectedSubgroup);
    
    socket.emit("joinGroup", { 
        group, 
        subgroup,
        username: currentUser.name
    });

    document.getElementById("messageInput").disabled = false;
    document.getElementById("sendButton").disabled = false;
    document.getElementById("attachButton").disabled = false;

    // Add a system message showing that user joined the group
    addSystemMessage(`You joined ${group} - ${subgroup}`);
}

// Add system message
function addSystemMessage(text) {
    const messageList = document.getElementById("messages");
    const systemMessage = document.createElement("div");
    systemMessage.className = "system-message";
    systemMessage.textContent = text;
    
    messageList.appendChild(systemMessage);
    messageList.scrollTop = messageList.scrollHeight;
}

// Send a new message
function sendMessage() {
    if (!currentUser || !selectedGroup || !selectedSubgroup) return;
    
    const messageInput = document.getElementById("messageInput");
    const message = messageInput.value.trim();

    if (message) {
        const timestamp = Date.now();
        const messageId = generateMessageId(currentUser.name, message, selectedGroup, selectedSubgroup);
        
        // Store timestamp in our local tracking
        messageTimestamps.data[messageId] = timestamp;
        messageTimestamps.save(messageTimestamps.data);
        
        const messageData = {
            group: selectedGroup,
            subgroup: selectedSubgroup,
            message,
            sender: currentUser.name,
            timestamp: timestamp // Add timestamp to the message data
        };
        
        socket.emit("sendMessage", messageData);
        messageInput.value = "";
    }
}

// Append messages to chat
function appendMessage(sender, message, timestamp) {
    const messageList = document.getElementById("messages");
    const messageItem = document.createElement("div");
    messageItem.className = "message-item";

    // Add class for sent/received messages
    const isSentMessage = sender === currentUser?.name;
    messageItem.classList.add(isSentMessage ? 'sent' : 'received');

    // Create message content
    const contentDiv = document.createElement("div");
    contentDiv.className = "message-content";
    
    const senderDiv = document.createElement("div");
    senderDiv.className = "message-sender";
    senderDiv.textContent = isSentMessage ? 'You' : sender;
    
    const messageText = document.createElement("div");
    messageText.className = "message-text";
    messageText.textContent = message;

    // Add time - check for existing timestamp in our tracking
    const timeDiv = document.createElement("div");
    timeDiv.className = "message-time";
    
    let timeText = "--:--"; // Default placeholder
    
    // Try to get timestamp from parameter first
    if (timestamp && !isNaN(new Date(timestamp).getTime())) {
        const messageTime = new Date(timestamp);
        timeText = messageTime.getHours().toString().padStart(2, '0') + ':' + 
                   messageTime.getMinutes().toString().padStart(2, '0');
    } else {
        // If no timestamp provided, check our local storage
        const messageId = generateMessageId(sender, message, selectedGroup, selectedSubgroup);
        const storedTimestamp = messageTimestamps.data[messageId];
        
        if (storedTimestamp) {
            const messageTime = new Date(storedTimestamp);
            timeText = messageTime.getHours().toString().padStart(2, '0') + ':' + 
                      messageTime.getMinutes().toString().padStart(2, '0');
        }
    }
    
    timeDiv.textContent = timeText;

    contentDiv.appendChild(senderDiv);
    contentDiv.appendChild(messageText);
    contentDiv.appendChild(timeDiv);
    messageItem.appendChild(contentDiv);
    
    messageList.appendChild(messageItem);
    messageList.scrollTop = messageList.scrollHeight;
}

// Receive previous messages when joining a group
socket.on("groupMessages", (messages) => {
    const messageList = document.getElementById("messages");
    messageList.innerHTML = "";
    messages.forEach(({ message, sender, timestamp }) => {
        // If message doesn't have timestamp, check if we have stored it
        if (!timestamp) {
            const messageId = generateMessageId(sender, message, selectedGroup, selectedSubgroup);
            timestamp = messageTimestamps.data[messageId];
        }
        appendMessage(sender, message, timestamp);
        
        // Store message timestamp if it has one
        if (timestamp) {
            const messageId = generateMessageId(sender, message, selectedGroup, selectedSubgroup);
            messageTimestamps.data[messageId] = timestamp;
        }
    });
    
    // Save any updated timestamps
    messageTimestamps.save(messageTimestamps.data);
});

// Receive new messages
socket.on("message", ({ message, sender, timestamp }) => {
    appendMessage(sender, message, timestamp);
});

// Handle user joined notification
socket.on("userJoined", (username) => {
    if (username !== currentUser?.name) {
        addSystemMessage(`${username} joined the chat`);
    }
});

socket.on("userLeft", (username) => {
    addSystemMessage(`${username} left the chat`);
});

// Handle attachment button click
document.getElementById("attachButton").addEventListener("click", function() {
    alert("File attachment feature coming soon!");
});

socket.on("connect", () => {
    console.log("Socket connected:", socket.id); // Log the socket ID
});

// Handle message error
socket.on("messageError", ({ error }) => {
    console.error("Message error:", error);
    alert("Failed to send message. Please try again.");
});

// Receive active user count
socket.on("activeUsers", (count) => {
    document.getElementById("activeUserCount").textContent = count;
});
