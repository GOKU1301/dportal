const { getFirestore, collection, query, where, orderBy, getDocs, addDoc } = require("firebase/firestore");
const db = require("./firebaseConfig");

const messagesCollection = collection(db, "messages");

async function getMessages(group) {
    if (!group) {
        console.error("Invalid group name for fetching messages.");
        return [];
    }

    try {
        const q = query(messagesCollection, where("group", "==", group), orderBy("timestamp", "asc"));
        const snapshot = await getDocs(q);

        const messages = snapshot.docs.map(doc => doc.data());
        console.log("Fetched messages:", messages);

        return messages;
    } catch (error) {
        console.error("Error fetching messages:", error);
        return [];
    }
}

async function saveMessage(group, message, sender) {
    try {
        const messageData = {
            group,
            message,
            sender,
            timestamp: new Date()
        };
        await addDoc(messagesCollection, messageData);
        console.log("Message saved to Firestore:", messageData);
    } catch (error) {
        console.error("Error saving message:", error);
    }
}

module.exports = { getMessages, saveMessage };
