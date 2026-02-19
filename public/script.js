const socket = io();
const videoGrid = document.getElementById('video-grid');
const setupScreen = document.getElementById('setup-screen');
const roomIdDisplay = document.getElementById('room-id-display');

// WebRTC Configuration
const configuration = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" }
    ]
};

// Constraints
const constraints = {
    audio: true,
    video: {
        width: { ideal: 640 },
        height: { ideal: 360 },
        frameRate: { max: 20 }
    }
};

let localStream;
let myId;
const peers = {}; // socketId -> { pc, stream, videoElement }

// Get or generate Room ID
const urlPath = window.location.pathname;
let roomId = urlPath.startsWith('/room/') ? urlPath.split('/room/')[1] : null;

if (!roomId) {
    roomId = Math.random().toString(36).substring(2, 8);
    window.history.replaceState(null, '', `/room/${roomId}`);
}
roomIdDisplay.innerText = `Room: ${roomId}`;

async function startCall() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia(constraints);
        setupScreen.classList.add('hidden');

        // Add Local Video
        addVideoElement('local', localStream, true);

        // Join Room
        socket.emit('join-room', roomId);
    } catch (err) {
        console.error('Error accessing media devices:', err);
        alert('Could not access camera/microphone. Please ensure permissions are granted.');
    }
}

socket.on('connect', () => {
    myId = socket.id;
});

socket.on('room-full', () => {
    alert('This room is full (max 3 people). Please try another room.');
    window.location.href = '/';
});

// Received when we join a room with existing users
socket.on('all-users', (users) => {
    users.forEach(userId => {
        createPeerConnection(userId, true); // We are the initiator
    });
});

// Received when a new user joins
socket.on('user-joined', (userId) => {
    createPeerConnection(userId, false); // New user will initiate, wait for offer
});

socket.on('offer', async ({ offer, sender }) => {
    const pc = peers[sender].pc;
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit('answer', { answer, target: sender });
});

socket.on('answer', async ({ answer, sender }) => {
    const pc = peers[sender].pc;
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on('ice-candidate', async ({ candidate, sender }) => {
    try {
        if (peers[sender] && peers[sender].pc) {
            await peers[sender].pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
    } catch (e) {
        console.error('Error adding received ice candidate', e);
    }
});

socket.on('user-left', (userId) => {
    if (peers[userId]) {
        peers[userId].pc.close();
        peers[userId].videoElement.remove();
        delete peers[userId];
        updateGridLayout();
    }
});

function createPeerConnection(userId, isInitiator) {
    const pc = new RTCPeerConnection(configuration);

    peers[userId] = { pc };

    pc.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('ice-candidate', {
                candidate: event.candidate,
                target: userId
            });
        }
    };

    pc.ontrack = (event) => {
        if (!peers[userId].stream) {
            peers[userId].stream = event.streams[0];
            addVideoElement(userId, event.streams[0], false);
        }
    };

    if (isInitiator) {
        pc.onnegotiationneeded = async () => {
            try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                socket.emit('offer', { offer, target: userId });
            } catch (err) {
                console.error(err);
            }
        };
    }

    // Add local tracks to peer connection after listeners are set
    localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
    });
}

function addVideoElement(id, stream, isLocal) {
    const container = document.createElement('div');
    container.className = 'video-container';
    container.id = `container-${id}`;

    const video = document.createElement('video');
    video.srcObject = stream;
    video.autoplay = true;
    video.playsInline = true;
    if (isLocal) video.muted = true;
    else video.className = 'remote-video';

    const label = document.createElement('div');
    label.className = 'user-label';
    label.innerText = isLocal ? 'You' : `Peer ${id.substring(0, 4)}`;

    container.appendChild(video);
    container.appendChild(label);
    videoGrid.appendChild(container);

    if (!isLocal) {
        peers[id].videoElement = container;
    }

    updateGridLayout();
}

function updateGridLayout() {
    const count = videoGrid.children.length;
    videoGrid.className = `grid-${count}`;
}

// Controls
document.getElementById('toggle-mic').addEventListener('click', (e) => {
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        e.currentTarget.classList.toggle('off', !audioTrack.enabled);
    }
});

document.getElementById('toggle-cam').addEventListener('click', (e) => {
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        e.currentTarget.classList.toggle('off', !videoTrack.enabled);
    }
});

document.getElementById('leave-btn').addEventListener('click', () => {
    window.location.href = '/';
});
