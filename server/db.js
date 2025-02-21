const { getFirestore, collection, query, where, orderBy, getDocs, addDoc } = require("firebase/firestore");
const { db } = require("./firebaseConfig");

const messagesCollection = collection(db, "messages");

async function getMessages(group) {
    if (!group) {
        console.error("Invalid group name for fetching messages.");
        return [];
    }

    try {
        const q = query(messagesCollection, where("group", "==", group), orderBy("timestamp", "asc"));
        const snapshot = await getDocs(q);

        // Map only the fields we want to return
        const messages = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                group: data.group,
                message: data.message,
                sender: data.sender,
                timestamp: data.timestamp
            };
        });
        
        console.log("Fetched messages:", messages);
        return messages;
    } catch (error) {
        console.error("Error fetching messages:", error);
        return [];
    }
}

async function saveMessage(group, message, sender) {
    if (!group || !message || !sender) {
        console.error("Missing required fields for saving message");
        throw new Error("Missing required fields");
    }

    try {
        // Explicitly create message object with only the fields we want
        const messageData = {
            group: group,
            message: message,
            sender: sender,
            timestamp: new Date()
        };

        const docRef = await addDoc(messagesCollection, messageData);
        console.log("Message saved to Firestore with ID:", docRef.id);
        return messageData;
    } catch (error) {
        console.error("Error saving message:", error);
        throw error;
    }
}

module.exports = { getMessages, saveMessage };
