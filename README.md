# RealTime Chat Application

A real-time chat application designed for students to communicate with each other. Built with Node.js, Express, Socket.IO, and Firebase.

## Features

- Real-time messaging
- User authentication (Firebase)
- Responsive design
- Group chat functionality
- Online/Offline user status

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Firebase project with Authentication and Realtime Database enabled

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd dportal
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Firebase:
   - Create a new project in the [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication and Realtime Database
   - Create a web app in your Firebase project
   - Copy your Firebase configuration

4. Create a `.env` file in the root directory and add your Firebase configuration:
   ```
   FIREBASE_API_KEY=your-api-key
   FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_STORAGE_BUCKET=your-bucket.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   FIREBASE_APP_ID=your-app-id
   ```

## Running the Application

### Development Mode
```bash
npm run dev
```
This will start the development server with nodemon for automatic reloading.

### Production Mode
```bash
npm start
```

## Project Structure

```
dportal/
├── api/               # API routes
├── public/            # Static files
├── server/            # Server-side code
│   └── server.js      # Main server file
├── .env               # Environment variables
├── .gitignore
├── package.json
└── README.md
```

## Built With

- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [Socket.IO](https://socket.io/)
- [Firebase](https://firebase.google.com/)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.
