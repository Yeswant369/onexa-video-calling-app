const socket = io();
const videoGrid = document.getElementById('video-grid');
const setupScreen = document.getElementById('setup-screen');
const roomIdDisplay = document.getElementById('room-id-display');

const configuration = {
    iceServers: [
        {
            urls: "stun:stun.relay.metered.ca:80",
        },
        {
            urls: "turn:global.relay.metered.ca:80",
            username: "16b99ab63d6212aec471251c",
            credential: "GGEeVpdI8CZDCKdJ",
        },
        {
            urls: "turn:global.relay.metered.ca:80?transport=tcp",
            username: "16b99ab63d6212aec471251c",
            credential: "GGEeVpdI8CZDCKdJ",
        },
        {
            urls: "turn:global.relay.metered.ca:443",
            username: "16b99ab63d6212aec471251c",
            credential: "GGEeVpdI8CZDCKdJ",
        },
        {
            urls: "turns:global.relay.metered.ca:443?transport=tcp",
            username: "16b99ab63d6212aec471251c",
            credential: "GGEeVpdI8CZDCKdJ",
        }
    ],
    iceCandidatePoolSize: 10
};

const constraints = {
    audio: true,
    video: {
        width: { ideal: 640 },
        height: { ideal: 360 },
        frameRate: { max: 20 }
    }
};

let localStream;
const peers = {}; // socketId -> { pc, queue, videoElement }

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
        addVideoElement('local', localStream, true);
        socket.emit('join-room', roomId);
    } catch (err) {
        console.error('Error accessing media devices:', err);
        alert('Could not access camera/microphone. Please ensure permissions are granted.');
    }
}

socket.on('room-full', () => {
    alert('This room is full (max 3 people). Please try another room.');
    window.location.href = '/';
});

socket.on('all-users', (users) => {
    console.log('Existing users in room:', users);
    users.forEach(userId => createPeerConnection(userId, true));
});

socket.on('user-joined', (userId) => {
    console.log('New user joined:', userId);
    createPeerConnection(userId, false);
});

socket.on('offer', async ({ offer, sender }) => {
    console.log('Received offer from:', sender);
    if (!peers[sender]) createPeerConnection(sender, false);
    const pc = peers[sender].pc;

    try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('answer', { answer, target: sender });
        processQueuedCandidates(sender);
    } catch (err) {
        console.error('Error handling offer:', err);
    }
});

socket.on('answer', async ({ answer, sender }) => {
    console.log('Received answer from:', sender);
    if (peers[sender]) {
        try {
            await peers[sender].pc.setRemoteDescription(new RTCSessionDescription(answer));
            processQueuedCandidates(sender);
        } catch (err) {
            console.error('Error handling answer:', err);
        }
    }
});

socket.on('ice-candidate', async ({ candidate, sender }) => {
    if (peers[sender]) {
        const pc = peers[sender].pc;
        if (pc.remoteDescription) {
            try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
                console.error('Error adding ice candidate:', e);
            }
        } else {
            peers[sender].queue.push(candidate);
        }
    }
});

socket.on('user-left', (userId) => {
    console.log('User left:', userId);
    if (peers[userId]) {
        peers[userId].pc.close();
        if (peers[userId].videoElement) peers[userId].videoElement.remove();
        delete peers[userId];
        updateGridLayout();
    }
});

function createPeerConnection(userId, isInitiator) {
    if (peers[userId]) return;

    console.log(`Creating PeerConnection for ${userId}, isInitiator: ${isInitiator}`);
    const pc = new RTCPeerConnection(configuration);
    peers[userId] = { pc, queue: [] };

    pc.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('ice-candidate', {
                candidate: event.candidate,
                target: userId
            });
        }
    };

    pc.oniceconnectionstatechange = () => {
        console.log(`ICE State with ${userId}: ${pc.iceConnectionState}`);
        if (pc.iceConnectionState === 'failed') {
            pc.restartIce();
        }
    };

    pc.ontrack = (event) => {
        console.log(`Received track from ${userId}:`, event.track.kind);
        const remoteStream = event.streams[0] || new MediaStream([event.track]);
        addVideoElement(userId, remoteStream, false);
    };

    // Add tracks to PeerConnection
    localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
    });

    if (isInitiator) {
        pc.onnegotiationneeded = async () => {
            try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                socket.emit('offer', { offer, target: userId });
            } catch (err) {
                console.error('Negotiation Error:', err);
            }
        };
    }
}

function processQueuedCandidates(userId) {
    if (peers[userId] && peers[userId].queue.length > 0) {
        console.log(`Processing ${peers[userId].queue.length} queued candidates for ${userId}`);
        peers[userId].queue.forEach(async (candidate) => {
            try {
                await peers[userId].pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
                console.error('Error adding queued candidate:', e);
            }
        });
        peers[userId].queue = [];
    }
}

function addVideoElement(id, stream, isLocal) {
    let container = document.getElementById(`container-${id}`);

    if (container) {
        // If container exists, just update the stream if it's different
        const video = container.querySelector('video');
        if (video.srcObject !== stream) video.srcObject = stream;
        return;
    }

    container = document.createElement('div');
    container.className = 'video-container';
    container.id = `container-${id}`;

    const video = document.createElement('video');
    video.srcObject = stream;
    video.autoplay = true;
    video.playsInline = true;
    // VERY IMPORTANT: set muted for remote then unmute after a tiny delay or interaction
    // to bypass some strict browser autoplay policies
    if (isLocal) {
        video.muted = true;
    } else {
        video.className = 'remote-video';
    }

    const label = document.createElement('div');
    label.className = 'user-label';
    label.innerText = isLocal ? 'You' : `Peer ${id.substring(0, 4)}`;

    container.appendChild(video);
    container.appendChild(label);
    videoGrid.appendChild(container);

    if (!isLocal) {
        peers[id].videoElement = container;
    }

    // Force play for Safari/Chrome robustness
    video.play().catch(e => console.warn("Video play failed (waiting for interaction):", e));

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
