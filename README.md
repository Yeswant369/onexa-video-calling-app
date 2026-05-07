# 🎥 Onexa Video Call

A minimal, secure, and performant 3-person WebRTC video calling application built with **Node.js**, **Socket.io**, and **Vanilla JavaScript**. Experience peer-to-peer video communication with a modern, glassmorphic UI.

---

## ✨ Features

- **🔐 Peer-to-Peer Media**: Direct media streaming between users (no server relay)
- **👥 3-User Rooms**: Optimized for up to 3 participants per room
- **🎨 Modern UI**: Sleek glassmorphism design with dark theme
- **📱 Responsive Design**: 
  - 1 user: Full screen
  - 2 users: Split view
  - 3 users: Grid layout
- **⚡ Performance Optimized**: 640x360 @ 20fps video for smooth streaming
- **🎚️ Media Controls**: Toggle camera and microphone on/off
- **🚀 Easy Deployment**: One-click Railway deployment

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| **Backend** | Node.js + Express |
| **Signaling** | Socket.io |
| **Video/Audio** | WebRTC API |
| **Frontend** | Vanilla JavaScript + HTML/CSS |
| **NAT Traversal** | Google STUN Server |

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Modern web browser with WebRTC support

### Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Yeswant369/onexa-video-calling-app.git
   cd onexa-video-calling-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm start
   ```

4. **Open the application**:
   - Navigate to `http://localhost:3000`
   - Open multiple tabs/windows to test with different users
   - Share the URL with others to test in real scenarios

5. **Join a specific room**:
   - Use `http://localhost:3000/room/your-room-id` to join a named room
   - Share the same room URL with others to connect

---

## 📦 Deployment

### Deploy to Railway (Recommended)

Railway provides free hosting and automatic deployments from GitHub. Follow these steps:

1. **Prepare your repository**:
   - Ensure your code is pushed to GitHub
   - Railway automatically detects `package.json` and the `start` script

2. **Deploy on Railway**:
   - Visit [Railway.app](https://railway.app/)
   - Click **+ New Project**
   - Select **Deploy from GitHub repo**
   - Choose this repository
   - Click **Deploy Now**

3. **Environment Variables**:
   - No configuration needed! Railway automatically assigns a `PORT` environment variable

4. **Access your app**:
   - Railway provides a public URL (e.g., `https://onexa-production.up.railway.app`)
   - Join rooms by appending `/room/your-room-id`
   - Share the URL with friends to start video calling

### Other Deployment Options

- **Heroku**: Similar process with automatic detection
- **Self-hosted**: Deploy to any VPS with Node.js support
- **Docker**: Containerize and deploy anywhere

---

## 📋 How It Works

### Signaling Flow
1. Users connect to the signaling server via Socket.io
2. Server exchanges **SDP offers and answers** between peers
3. **ICE candidates** are relayed for NAT traversal
4. Once connected, media streams directly between peers (P2P)

### WebRTC Connection
- Uses native browser **RTCPeerConnection** API
- **Google's STUN server** (`stun:stun.l.google.com:19302`) for NAT traversal
- No TURN server needed for most connections

### Architecture
```
User A ←→ Signaling Server ←→ User B
   ↓                              ↓
   └──── Direct P2P Connection ────┘
     (Media streams here)
```

---

## 🎯 Room Management

### Creating a Room
- Simply navigate to `/room/your-custom-room-name`
- A room is created automatically when the first user joins
- Up to 3 users can be in a room simultaneously

### Room URL Format
```
http://localhost:3000/room/my-meeting
```

---

## 🎬 Usage Tips

1. **Optimal Performance**:
   - Use WiFi for best results
   - Close unnecessary browser tabs
   - Ensure good lighting for camera

2. **Room Privacy**:
   - Use unique, hard-to-guess room names
   - Share links only with intended participants
   - Room data isn't persisted after disconnect

3. **Troubleshooting**:
   - Check camera/microphone permissions
   - Ensure WebRTC is supported in your browser
   - Try refreshing if connection drops
   - Check browser console for error messages

---

## 🔧 API Reference

### Socket Events

#### Client → Server
- `join-room`: User joins a specific room
- `offer`: Send WebRTC offer to peer
- `answer`: Send WebRTC answer to peer
- `ice-candidate`: Send ICE candidate for connection

#### Server → Client
- `room-users`: List of users in the room
- `user-joined`: Notification of new user
- `user-left`: Notification of user disconnect
- `offer`: Receive offer from peer
- `answer`: Receive answer from peer
- `ice-candidate`: Receive ICE candidate

---

## 📱 Browser Compatibility

| Browser | Desktop | Mobile |
|---------|---------|--------|
| Chrome | ✅ 76+ | ✅ 76+ |
| Firefox | ✅ 68+ | ✅ 68+ |
| Safari | ✅ 11+ | ✅ 11+ |
| Edge | ✅ 79+ | ✅ 79+ |

---

## 🚀 Future Enhancements

- [ ] Screen sharing
- [ ] Recording capabilities
- [ ] Message chat
- [ ] User profiles & avatars
- [ ] Room persistent storage
- [ ] SFU (Selective Forwarding Unit) for 4+ users
- [ ] Custom TURN server support
- [ ] Conference mode (presenter view)

---

## 📝 Project Structure

```
onexa-video-calling-app/
├── public/
│   ├── index.html
│   ├── styles.css
│   └── script.js
├── server.js
├── package.json
└── README.md
```

---

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs via GitHub Issues
- Submit feature requests
- Create pull requests with improvements

---

## 📄 License

This project is open source and available under the MIT License.

---

## 📞 Support & Contact

- **GitHub**: [Yeswant369/onexa-video-calling-app](https://github.com/Yeswant369/onexa-video-calling-app)
- **Issues**: [Report a bug](https://github.com/Yeswant369/onexa-video-calling-app/issues)

---

## ⭐ Show Your Support

If you find this project helpful, please consider giving it a star on GitHub!

---

**Built with ❤️ for seamless video communication**
