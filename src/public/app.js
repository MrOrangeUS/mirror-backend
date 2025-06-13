const socket = io();
const video = document.getElementById('avatar');
const status = document.getElementById('status');
const qr = document.getElementById('qr');

let peerConnection;
let streamId;
let sessionId;

// Initialize WebRTC
async function initWebRTC() {
    try {
        status.textContent = 'Connecting…';

        // 1) Grab a new stream, D-ID's SDP offer, and ICE servers
        const { streamId, sessionId, offer, iceServers } = await fetch('/streams', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }).then(r => r.json());

        // 2) Build RTCPeerConnection with D-ID's STUN/TURN hints
        peerConnection = new RTCPeerConnection({ iceServers });

        // 3) When video arrives, hook it up
        peerConnection.ontrack = evt => {
            video.srcObject = evt.streams[0];
            status.style.display = 'none';
        };

        // 4) Trickle our own ICE candidates
        peerConnection.onicecandidate = async evt => {
            if (!evt.candidate) return;
            await fetch(`/streams/${streamId}/ice`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    candidate:      evt.candidate.candidate,
                    sdpMid:         evt.candidate.sdpMid,
                    sdpMLineIndex:  evt.candidate.sdpMLineIndex
                })
            });
        };

        // 5) Apply D-ID's offer (must be the raw SDP string)
        await peerConnection.setRemoteDescription({
            type: 'offer',
            sdp:  offer
        });

        // 6) Create our answer and send it exactly once
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        console.log('✅ Sending SDP answer:', answer.sdp);
        await fetch(`/streams/${streamId}/sdp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answer: { type: answer.type, sdp: answer.sdp } })
        });

        status.textContent = 'Connected—waiting for avatar…';
    }
    catch (err) {
        console.error('WebRTC initialization error:', err);
        status.textContent = 'Connection failed—retrying…';
        setTimeout(initWebRTC, 10000);
    }
}

// Handle chat messages
async function handleChatMessage(message) {
    try {
        // Get response from ChatGPT
        const chatResponse = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        const { response } = await chatResponse.json();

        // Send to D-ID
        await fetch(`/streams/${streamId}/say`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: response })
        });
    } catch (error) {
        console.error('Chat handling error:', error);
    }
}

// Socket.IO event handlers
socket.on('connect', () => {
    console.log('Connected to server');
    initWebRTC();
});

socket.on('chat_message', handleChatMessage);

socket.on('disconnect', () => {
    console.log('Disconnected from server');
    status.style.display = 'block';
    status.textContent = 'Disconnected. Reconnecting...';
});

// Generate QR code
async function generateQR() {
    try {
        const response = await fetch('/qr');
        const { qrCode } = await response.json();
        qr.innerHTML = qrCode;
    } catch (error) {
        console.error('QR code generation error:', error);
    }
}

// Initialize
generateQR();

// Chat UI logic
const chatHistory = document.getElementById('chat-history');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');

function appendMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-msg ' + sender;
    msgDiv.textContent = text;
    chatHistory.appendChild(msgDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;
    appendMessage(message, 'user');
    chatInput.value = '';
    try {
        // Get response from ChatGPT
        const chatResponse = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        const { response } = await chatResponse.json();
        appendMessage(response, 'bot');
        // Avatar speech is disabled for now
        // await fetch(`/streams/${streamId}/say`, {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ text: response })
        // });
    } catch (error) {
        appendMessage('Error: Could not get response.', 'bot');
        console.error('Chat handling error:', error);
    }
}

sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// On page load, show the conversation starter
window.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch('/chat-starter');
        const { starter } = await res.json();
        appendMessage(starter, 'bot');
    } catch (e) {
        appendMessage('Welcome! Ask me anything.', 'bot');
    }
}); 