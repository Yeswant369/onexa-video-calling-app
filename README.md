# Onexa Video Call

A minimal, secure, 3-person WebRTC video calling application built with Node.js, Socket.io, and Vanilla JS.

## Features
- Peer-to-peer media (No media through server)
- Max 3 users per room
- Dark Modern UI (Glassmorphism)
- Responsive layout (1 users: full, 2: split, 3: grid)
- 640x360 @ 20fps video cap for performance
- Camera and Microphone toggles

## Local Development
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the server:
   ```bash
   npm start
   ```
3. Open `http://localhost:3000` in multiple tabs to test.

## Railway Deployment Instructions

1. **Prepare your repository**:
   - Ensure your code is pushed to a GitHub repository.
   - Railway will automatically detect the `package.json` and `start` script.

2. **Deploy on Railway**:
   - Log in to [Railway.app](https://railway.app/).
   - Click **+ New Project**.
   - Select **Deploy from GitHub repo**.
   - Choose this repository.
   - Click **Deploy Now**.

3. **Environment Variables**:
   - No specific environment variables are required, but Railway will automatically provide a `PORT`.

4. **Accessing the app**:
   - Once deployed, Railway will provide a public URL (e.g., `onexa-production.up.railway.app`).
   - You can join a specific room by appending `/room/your-room-id` to the URL.

## Technical Details
- **Signaling**: Socket.io handles the exchange of SDP offers, answers, and ICE candidates.
- **WebRTC**: Uses the native browser API (`RTCPeerConnection`).
- **STUN**: Uses Google's free STUN server (`stun:stun.l.google.com:19302`).
- **Scaling**: While this is a P2P implementation for 3 users, the signaling logic can be extended to support more users or integrated with an SFU (Selective Forwarding Unit) if needed in the future.
